// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon.GameLift;
using Amazon.GameLift.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.ManagementService.Data;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public static class GameLiftStateHandler
    {
        /// <summary>Makes multiple GameLift API requests to retrieve GameLift data and constructs a GameLiftStateEventDetail object</summary>
        public static async Task<GameLiftStateEventDetail> GetStateEventDetail()
        {
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());
            var stateEvent = new GameLiftStateEventDetail();

            var dynamoDbClient = new AmazonDynamoDBClient();
            stateEvent.Aliases = await gameLiftRequestHandler.GetAliases();
            stateEvent.GameSessionQueues = await gameLiftRequestHandler.GetGameSessionQueues();

            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);

            var configDocument = await dynamoDbRequestHandler.GetManagementConfig("mainConfig");
            
            var matchmakingConfigurations = await gameLiftRequestHandler.GetMatchmakingConfigurations();

            LambdaLogger.Log("SIMULATOR ARN:" + configDocument.FlexMatchSimulatorArn);
                
            // remove flexmatch simulator config as we don't want it in the state
            var flexMatchSimulatorConfig = matchmakingConfigurations.Single(matchmakingConfig => matchmakingConfig.ConfigurationArn == configDocument.FlexMatchSimulatorArn);
            matchmakingConfigurations.Remove(flexMatchSimulatorConfig);
            stateEvent.MatchmakingSimulator = flexMatchSimulatorConfig;

            stateEvent.MatchmakingConfigurations = matchmakingConfigurations;
            try
            {
                var fleetCapacities = await gameLiftRequestHandler.GetFleetCapacities();

                foreach (var fleetCapacity in fleetCapacities)
                {
                    var fleetId = fleetCapacity.FleetId;
                    
                    var activeGameSessions = await dynamoDbRequestHandler.GetDatabaseGameSessionsByStatus(fleetId, "ACTIVE");
                    
                    var gameSessions = new List<GameSession>();
                    foreach (var gameSession in activeGameSessions)
                    {
                        gameSessions.Add(gameSession);
                    }
                    
                    var terminatedGameSessions = await dynamoDbRequestHandler.GetDatabaseGameSessionsByStatus(fleetId, "TERMINATED");
            
                    foreach (var gameSession in terminatedGameSessions)
                    {
                        if (gameSession.TerminationTime > (DateTime.Now - TimeSpan.FromMinutes(10)))
                        {
                            gameSessions.Add(gameSession);
                        }
                    }

                    var locationAttributes = await gameLiftRequestHandler.GetFleetLocationAttributes(fleetId);

                    var instances = new List<Instance>();
                    var locationCapacities = new List<FleetCapacity>();
                    foreach (var locationAttribute in locationAttributes)
                    {
                        var locationCapacity = await gameLiftRequestHandler.GetFleetLocationCapacity(fleetId, locationAttribute.LocationState.Location);
                        locationCapacities.Add(locationCapacity);

                        var locationInstances = await gameLiftRequestHandler.GetFleetInstances(fleetId, locationAttribute.LocationState.Location);
                        instances.AddRange(locationInstances);
                    }

                    var fleetData = new FleetData
                    {
                        FleetId = fleetId,
                        LocationAttributes = locationAttributes,
                        FleetCapacity = fleetCapacity,
                        LocationCapacities = locationCapacities,
                        ScalingPolicies = await gameLiftRequestHandler.GetScalingPolicies(fleetId),
                        RuntimeConfiguration = await gameLiftRequestHandler.GetRuntimeConfiguration(fleetId),
                        FleetEvents = await gameLiftRequestHandler.GetFleetEvents(fleetId),
                        FleetUtilization = await gameLiftRequestHandler.GetFleetUtilization(fleetId),
                        FleetAttributes = await gameLiftRequestHandler.GetFleetAttributes(fleetId),
                        Instances = instances,
                        GameSessions = gameSessions,
                    };

                    stateEvent.FleetData.Add(fleetData);
                }
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }



            return stateEvent;
        }
        
        /// <summary>Polls active Game Sessions and updates non-active to be Terminated</summary>
        public static async Task<bool> UpdateGameSessions()
        {
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());

            var dynamoDbClient = new AmazonDynamoDBClient();

            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            
            try
            {
                var fleetIds = await gameLiftRequestHandler.GetFleetIds();
                var gameSessions = new List<GameSession>();
                
                foreach (var fleetId in fleetIds)
                {
                    var databaseActiveGameSessions = await dynamoDbRequestHandler.GetDatabaseGameSessionsByStatus(fleetId, "ACTIVE");
                    var activeGameSessions = await gameLiftRequestHandler.GetGameSessions(fleetId, "ACTIVE");
                    var gameSessionTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("GameSessionTableName"));

                    foreach (var gameSession in activeGameSessions)
                    {
                        var item = Document.FromJson(JsonConvert.SerializeObject(gameSession));
                        item["StatusValue"] = gameSession.Status.Value;
                        await gameSessionTable.PutItemAsync(item);
                        gameSessions.Add(gameSession);
                    }

                    foreach (var dbGameSession in databaseActiveGameSessions)
                    {
                        var match = activeGameSessions.FirstOrDefault(gameSession => gameSession.GameSessionId == dbGameSession.GameSessionId);
                        if (match==null)
                        {
                            // This game session is no longer active
                            LambdaLogger.Log("SHOULD SET GAME SESSION " + dbGameSession.GameSessionId + " TO BE TERMINATED!");
                            var terminationTime = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                            LambdaLogger.Log(terminationTime);
                            
                            var updateRequest = new UpdateItemRequest
                            {
                                TableName = Environment.GetEnvironmentVariable("GameSessionTableName"),
                                Key = new Dictionary<string, Amazon.DynamoDBv2.Model.AttributeValue>()
                                    {{"GameSessionId", new Amazon.DynamoDBv2.Model.AttributeValue {S = dbGameSession.GameSessionId}}},
                                UpdateExpression = "SET #statusValue = :statusValue, #terminationTime = :terminationTime, #status.#value = :statusValue",
                                ExpressionAttributeNames = new Dictionary<string, string>
                                {
                                    {"#statusValue", "StatusValue"},
                                    {"#status", "Status"},
                                    {"#value", "Value"},
                                    {"#terminationTime", "TerminationTime"},
                                },
                                ExpressionAttributeValues = new Dictionary<string, Amazon.DynamoDBv2.Model.AttributeValue>()
                                {
                                    {":statusValue", new Amazon.DynamoDBv2.Model.AttributeValue { S = "TERMINATED" }},
                                    {":terminationTime", new Amazon.DynamoDBv2.Model.AttributeValue { S = terminationTime }},
                                }
                            };
                            
                            try
                            {
                                await dynamoDbClient.UpdateItemAsync(updateRequest);
                                LambdaLogger.Log("Game session " + dbGameSession.GameSessionId + " UPDATED!");
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.Message);
                            }
                        }
                        else
                        {
                            LambdaLogger.Log(dbGameSession.GameSessionId + " IS STILL ACTIVE!");
                        }
                    }
                }
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return false;
            }

            return true;
        }
        
        /// <summary>Retrieves the most recent state event from DDB, if it's <30 minutes old</summary>
        public static async Task<GameLiftStateDatabaseItem> GetLatestStateDatabaseItem()
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            try
            {
                var stateLogTable =
                    Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("StateLogTableName"));

                var thirtyMinutesAgo = DateTime.UtcNow - TimeSpan.FromMinutes(30);
                var filter = new QueryFilter("Date", QueryOperator.Equal, thirtyMinutesAgo.Date);
                filter.AddCondition("Time", QueryOperator.GreaterThan, thirtyMinutesAgo);

                var queryConfig = new QueryOperationConfig
                {
                    Filter = filter,
                    BackwardSearch = true,
                    Limit = 1,
                };
                
                var search = stateLogTable.Query(queryConfig);
                
                var documentSet = await search.GetNextSetAsync();
                foreach (var document in documentSet)
                {
                    LambdaLogger.Log(document.ToJson());
                    return JsonConvert.DeserializeObject<GameLiftStateDatabaseItem>(document.ToJson());
                }
                
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
    }
}