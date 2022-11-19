// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Amazon;
using Amazon.CloudWatch;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.ECS;
using Amazon.GameLift;
using Amazon.GameLift.Model;
using Amazon.Lambda;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Lambda.Model;
using Amazon.S3;
using Amazon.S3.Model;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;
using Arn = Amazon.Runtime.Internal.Endpoints.StandardLibrary.Arn;
using Environment = System.Environment;
using JsonSerializer = System.Text.Json.JsonSerializer;
using Task = System.Threading.Tasks.Task;

namespace ManagementConsoleBackend.ManagementService
{
    public class ManagementService
    {
        private APIGatewayProxyRequest _request;
        private string _connectionId;
        private ClientMessage _body;

        public async Task<CfnResponse> PopulateConfigData(CfnRequest request, ILambdaContext context)
        {
            LambdaLogger.Log(JsonConvert.SerializeObject(request));
            LambdaLogger.Log(JsonConvert.SerializeObject(context));
            var dynamoDbClient = new AmazonDynamoDBClient();
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            var tableName = Environment.GetEnvironmentVariable("ConfigTableName");

            var response = new CfnResponse
            {
                Status = "SUCCESS",
                PhysicalResourceId = context.LogStreamName,
                StackId = request.StackId,
                RequestId = request.RequestId,
                LogicalResourceId = request.LogicalResourceId,
                Reason = "See the details in CloudWatch Log Stream: " + context.LogStreamName,
            };
            
            try
            {
                var configTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("ConfigTableName"));
                var item = new Document();
                item["ConfigId"] = "mainConfig";
                item["FlexMatchSimulatorArn"] = Environment.GetEnvironmentVariable("FlexMatchSimulatorArn");

                await configTable.PutItemAsync(item);
                
                HttpClient client = new HttpClient();

                var jsonContent = new StringContent(JsonConvert.SerializeObject(response));
                jsonContent.Headers.Remove("Content-Type");

                var postResponse = await client.PutAsync(request.ResponseURL, jsonContent);

                postResponse.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                LambdaLogger.Log("Exception: " + ex.ToString());

                response.Status = "FAILED";
                response.Data = ex;
            }

            LambdaLogger.Log(JsonConvert.SerializeObject(response));

            return response;
        }
        
        public async Task<CfnResponse> ConfigJsonGenerator(CfnRequest request, ILambdaContext context)
        {
            LambdaLogger.Log(JsonConvert.SerializeObject(request));
            LambdaLogger.Log(JsonConvert.SerializeObject(context));

            var tableName = Environment.GetEnvironmentVariable("ApiUrl");

            var s3Client = new AmazonS3Client();
            dynamic configObj = new 
            {
                ApiUrl = Environment.GetEnvironmentVariable("ApiUrl"),
                CognitoDomain = Environment.GetEnvironmentVariable("CognitoDomain"),
                AppClientId = Environment.GetEnvironmentVariable("AppClientId"),
                UserPoolId = Environment.GetEnvironmentVariable("UserPoolId"),
                IdentityPoolId = Environment.GetEnvironmentVariable("IdentityPoolId"),
                Region = Environment.GetEnvironmentVariable("Region"),
            };
            
            var response = new CfnResponse
            {
                Status = "SUCCESS",
                PhysicalResourceId = context.LogStreamName,
                StackId = request.StackId,
                RequestId = request.RequestId,
                LogicalResourceId = request.LogicalResourceId,
                Reason = "See the details in CloudWatch Log Stream: " + context.LogStreamName,
            };
            
            try
            {
                await s3Client.PutObjectAsync(new PutObjectRequest
                {
                    Key = "Config.json",
                    BucketName = Environment.GetEnvironmentVariable("BucketName"),
                    ContentBody = JsonConvert.SerializeObject(configObj),
                });
                
                HttpClient client = new HttpClient();

                var jsonContent = new StringContent(JsonConvert.SerializeObject(response));
                jsonContent.Headers.Remove("Content-Type");

                var postResponse = await client.PutAsync(request.ResponseURL, jsonContent);

                postResponse.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                LambdaLogger.Log("Exception: " + ex.ToString());

                response.Status = "FAILED";
                response.Data = ex;
            }

            LambdaLogger.Log(JsonConvert.SerializeObject(response));

            return response;
        }


        // Main Management Service APIGW handler - receives requests from the Management Console
        public async Task<APIGatewayProxyResponse> ManagementServiceHandler(APIGatewayProxyRequest request, ILambdaContext context)
        {
            _request = request;
            var dynamoDbClient = new AmazonDynamoDBClient();

            var stageServiceUrl = Environment.GetEnvironmentVariable("StageServiceUrl");
            var errorList = new List<string>();
            
            LambdaLogger.Log(JsonSerializer.Serialize(_request));
            try
            {
                _connectionId = request.RequestContext.ConnectionId;
                var eventType = request.RequestContext.EventType;
                Table connectionsTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("ConnectionsTableName"));

                if (eventType == "CONNECT") // this is just a connect request, so just store the connection id in DDB
                {
                    var item = new Document();
                    item["ConnectionId"] = _connectionId;
                    item["TimeToLive"] = (Utils.GetUnixTimestamp() + 86400*7);
                    await connectionsTable.PutItemAsync(item);
                }
                
                if (eventType == "DISCONNECT") // remove the connection from the connections table
                {
                    var item = new Document();
                    item["ConnectionId"] = _connectionId;
                    await connectionsTable.DeleteItemAsync(item);
                }

                if (eventType == "MESSAGE")
                {
                    try
                    {
                        _body = JsonConvert.DeserializeObject<ClientMessage>(request.Body);
                    }
                    catch (JsonReaderException e)
                    {
                        LambdaLogger.Log(e.ToString());
                        throw;
                    }

                    LambdaLogger.Log(_body.Type);
                    var gameLiftClient = new AmazonGameLiftClient();
                    if (_body.Region != null)
                    {
                        gameLiftClient = new AmazonGameLiftClient(Amazon.RegionEndpoint.GetBySystemName(_body.Region));
                    }

                    var gameLiftRequestHandler = new GameLiftRequestHandler(gameLiftClient);
                    var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
                    var virtualPlayersHandler = new VirtualPlayersHandler(new AmazonECSClient());
                    var cloudWatchRequestHandler = new CloudWatchRequestHandler(new AmazonCloudWatchClient());
                    
                    var response = new ServerMessage();
                    switch (_body.Type)
                    {
                        case "GetFleetAttributes":
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetFleetAttributes { FleetAttributes = await gameLiftRequestHandler.GetFleetAttributes()});
                            break;
                        
                        case "GetAliases":
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetAliases { Aliases = await gameLiftRequestHandler.GetAliases()});
                            break;

                        case "GetGameSessionQueueDestinationInfo":
                            var getQueueDestinationInfoRequest = JsonConvert.DeserializeObject<ClientMessageGetGameSessionQueueDestinationInfo>(request.Body);
                            var gameSessionQueue = await gameLiftRequestHandler.GetGameSessionQueue(getQueueDestinationInfoRequest.QueueArn);
                            var aliasRegions = new List<string>();
                            var fleetRegions = new List<string>();
                            var queueFleetAttributes = new List<FleetAttributes>();
                            var queueAliases = new List<Alias>();
                            foreach (var destination in gameSessionQueue.Destinations)
                            {
                                var arn = Arn.Parse(destination.DestinationArn);
                                if (arn.resourceId[0]=="alias" && aliasRegions.Contains(arn.region) == false)
                                {
                                    var regionGameLiftHandler = new GameLiftRequestHandler(new AmazonGameLiftClient(RegionEndpoint.GetBySystemName(arn.region)));
                                    queueAliases.AddRange(await regionGameLiftHandler.GetAliases());
                                    aliasRegions.Add(arn.region);
                                }
                                else
                                if (arn.resourceId[0]=="fleet" && fleetRegions.Contains(arn.region) == false)
                                {
                                    var regionGameLiftHandler = new GameLiftRequestHandler(new AmazonGameLiftClient(RegionEndpoint.GetBySystemName(arn.region)));
                                    queueFleetAttributes.AddRange(await regionGameLiftHandler.GetFleetAttributes());
                                    fleetRegions.Add(arn.region);
                                }
                            }
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetGameSessionQueueDestinationInfo
                            {
                                Aliases = queueAliases,
                                FleetAttributes = queueFleetAttributes,
                                GameSessionQueue = gameSessionQueue,
                            });
                            break;

                        case "GetFleetScaling":
                            var getFleetScalingRequest = JsonConvert.DeserializeObject<ClientMessageGetFleetScaling>(request.Body);
                            var fleetLocationCapacities = await gameLiftRequestHandler.GetFleetLocationCapacities(getFleetScalingRequest.FleetId);
                            var fleetScalingPolicies = await gameLiftRequestHandler.GetScalingPolicies(getFleetScalingRequest.FleetId);
                            LambdaLogger.Log("FLEET LOCATION CAPACITIES:" + JsonConvert.SerializeObject(fleetLocationCapacities));
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetFleetScaling { FleetCapacities = fleetLocationCapacities, ScalingPolicies = fleetScalingPolicies});
                            break;
                        
                        case "GetPlayerSessions":
                            var getPlayerSessionsRequest = JsonConvert.DeserializeObject<ClientMessageGetPlayerSessions>(request.Body);
                            var playerSessions = await gameLiftRequestHandler.GetPlayerSessions(getPlayerSessionsRequest.GameSessionId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetPlayerSessions { PlayerSessions = playerSessions});
                            break;
                       
                        case "GetGameSessionQueue":
                            var getQueueRequest = JsonConvert.DeserializeObject<ClientMessageGetGameSessionQueue>(request.Body);
                            var queue = await gameLiftRequestHandler.GetGameSessionQueue(getQueueRequest.QueueArn);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetGameSessionQueue { GameSessionQueue = queue});
                            break;
                        
                        case "GetQueueEvents":
                            var getQueueEventsRequest = JsonConvert.DeserializeObject<ClientMessageGetQueueEvents>(request.Body);
                            var queueEvents = await dynamoDbRequestHandler.GetDatabaseQueueEvents(getQueueEventsRequest.QueueArn);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetQueueEvents { Events = queueEvents});
                            break;
                        
                        case "GetQueueEventByPlacementId":
                            var getQueueEventByPlacementIdRequest = JsonConvert.DeserializeObject<ClientMessageGetQueueEventByPlacementId>(request.Body);
                            var queueEvent = await dynamoDbRequestHandler.GetDatabaseQueueEventByPlacementId(getQueueEventByPlacementIdRequest.PlacementId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetQueueEventByPlacementId { Event = queueEvent.Detail});
                            break;
                        
                        case "RunMatchmakingSimulation":
                            var runMatchmakingSimulationRequest = JsonConvert.DeserializeObject<ClientMessageRunMatchmakingSimulation>(request.Body);
                            MatchmakingSimulation simulation = null;
                            try
                            {
                                 simulation = await dynamoDbRequestHandler.CreateMatchmakingSimulation(runMatchmakingSimulationRequest);
                            }
                            catch (Exception e)
                            {
                                errorList.Add(e.Message);
                            }
                            
                            var lambdaClient = new AmazonLambdaClient();
                            try
                            {
                                await lambdaClient.InvokeAsync(
                                    new InvokeRequest
                                    {
                                        FunctionName = Environment.GetEnvironmentVariable("FlexMatchSimulatorFunctionName"),
                                        Payload = JsonConvert.SerializeObject(simulation),
                                        InvocationType = "Event",
                                    });
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.Message);
                                errorList.Add(e.Message);
                            }

                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageRunMatchmakingSimulation { Simulation = simulation, Errors = errorList });
                            break;
                        
                        case "GetMatchmakingSimulations":
                            var matchmakingSimulations = await dynamoDbRequestHandler.GetMatchmakingSimulations();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingSimulations { Simulations = matchmakingSimulations});
                            break;
                        
                        case "GetMatchmakingSimulation":
                            var getMatchmakingSimulationRequest = JsonConvert.DeserializeObject<ClientMessageGetMatchmakingSimulation>(request.Body);
                            var matchmakingSimulation = await dynamoDbRequestHandler.GetMatchmakingSimulation(getMatchmakingSimulationRequest.SimulationId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingSimulation { Simulation = matchmakingSimulation});
                            break;
                        
                        case "GetPlayerProfiles":
                            var playerProfiles = await dynamoDbRequestHandler.GetPlayerProfiles();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetPlayerProfiles { Profiles = playerProfiles});
                            break;
                        
                        case "SavePlayerProfile":
                            LambdaLogger.Log(request.Body);
                            try
                            {
                                var savePlayerProfileRequest =
                                    JsonConvert.DeserializeObject<ClientMessageSavePlayerProfile>(request.Body);
                                LambdaLogger.Log("PROFILE CONVERTED:" + JsonConvert.SerializeObject(savePlayerProfileRequest.Profile));
                                await dynamoDbRequestHandler.SavePlayerProfile(savePlayerProfileRequest.Profile);
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageSavePlayerProfile { Errors = new List<string>() });
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.ToString());
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageSavePlayerProfile { Errors = new List<string>
                                {
                                    e.Message
                                } });
                                throw;
                            }
                            break;
                        
                        case "DeletePlayerProfile":
                            LambdaLogger.Log(request.Body);
                            try
                            {
                                var deletePlayerProfileRequest =
                                    JsonConvert.DeserializeObject<ClientMessageDeletePlayerProfile>(request.Body);
                                await dynamoDbRequestHandler.DeletePlayerProfile(deletePlayerProfileRequest.ProfileId);
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageDeletePlayerProfile { Errors = new List<string>() });
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.ToString());
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageDeletePlayerProfile { Errors = new List<string>
                                {
                                    e.Message
                                } });
                                throw;
                            }
                            break;
                        
                        case "GetLatencyProfiles":
                            var getLatencyProfilesRequest = JsonConvert.DeserializeObject<ClientMessageGetLatencyProfiles>(request.Body);
                            var latencyProfiles = await dynamoDbRequestHandler.GetLatencyProfiles();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetLatencyProfiles { Profiles = latencyProfiles});
                            break;
                        
                        case "SaveLatencyProfile":
                            LambdaLogger.Log(request.Body);
                            try
                            {
                                var saveLatencyProfileRequest =
                                    JsonConvert.DeserializeObject<ClientMessageSaveLatencyProfile>(request.Body);
                                LambdaLogger.Log("PROFILE CONVERTED:" + JsonConvert.SerializeObject(saveLatencyProfileRequest.Profile));
                                await dynamoDbRequestHandler.SaveLatencyProfile(saveLatencyProfileRequest.Profile);
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageSaveLatencyProfile { Errors = new List<string>() });
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.ToString());
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageSaveLatencyProfile { Errors = new List<string>
                                {
                                    e.Message
                                } });
                                throw;
                            }
                            break;
                        
                        case "DeleteLatencyProfile":
                            LambdaLogger.Log(request.Body);
                            try
                            {
                                var deletePlayerProfileRequest =
                                    JsonConvert.DeserializeObject<ClientMessageDeleteLatencyProfile>(request.Body);
                                await dynamoDbRequestHandler.DeleteLatencyProfile(deletePlayerProfileRequest.ProfileId);
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageDeleteLatencyProfile { Errors = new List<string>() });
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.ToString());
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageDeleteLatencyProfile { Errors = new List<string>
                                {
                                    e.Message
                                } });
                                throw;
                            }
                            break;
                        
                        case "UpdateMatchmakingConfiguration":
                            var updateMatchmakingConfigurationRequest = JsonConvert.DeserializeObject<ClientMessageUpdateMatchmakingConfiguration>(request.Body);
                            var apiRequest = new UpdateMatchmakingConfigurationRequest
                            {
                                Name = updateMatchmakingConfigurationRequest.MatchmakingConfigName,
                                RuleSetName = updateMatchmakingConfigurationRequest.RuleSetName
                            };
                            var updateResponse = await gameLiftRequestHandler.UpdateMatchmakingConfiguration(apiRequest);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, updateResponse);
                            break;
                        
                        case "UpdateQueueSettings":
                            var updateQueueSettingsRequest = JsonConvert.DeserializeObject<ClientMessageUpdateQueueSettings>(request.Body);
                            var updateQueueSettingsApiRequest = new UpdateGameSessionQueueRequest
                            {
                                Name = updateQueueSettingsRequest.QueueArn,
                                TimeoutInSeconds = updateQueueSettingsRequest.TimeoutInSeconds,
                                PlayerLatencyPolicies = updateQueueSettingsRequest.PlayerLatencyPolicies.ToList(),
                            };

                            LambdaLogger.Log(JsonConvert.SerializeObject(updateQueueSettingsApiRequest));
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, await gameLiftRequestHandler.UpdateGameSessionQueue(updateQueueSettingsApiRequest));
                            break;
                        
                        case "UpdateQueuePriorityConfiguration":
                            var updateQueuePriorityConfigurationRequest = JsonConvert.DeserializeObject<ClientMessageUpdateQueuePriorityConfiguration>(request.Body);
                            var priorityConfiguration = new PriorityConfiguration
                            {
                                LocationOrder = updateQueuePriorityConfigurationRequest.LocationOrder.ToList(),
                                PriorityOrder = updateQueuePriorityConfigurationRequest.PriorityOrder.ToList(),
                            };
                            var updateQueuePriorityConfigurationApiRequest = new UpdateGameSessionQueueRequest
                            {
                                Name = updateQueuePriorityConfigurationRequest.QueueArn,
                                PriorityConfiguration = priorityConfiguration,
                            };
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, await gameLiftRequestHandler.UpdateGameSessionQueue(updateQueuePriorityConfigurationApiRequest));
                            break;
                        
                        case "UpdateQueueDestinations":
                            var updateQueueDestinationsRequest = JsonConvert.DeserializeObject<ClientMessageUpdateQueueDestinations>(request.Body);
                            var queueDestinations = new List<GameSessionQueueDestination>();
                            foreach (var destinationArn in updateQueueDestinationsRequest.Destinations)
                            {
                                queueDestinations.Add(new GameSessionQueueDestination
                                {
                                    DestinationArn = destinationArn
                                });
                            }
                            var updateQueueDestinationsApiRequest = new UpdateGameSessionQueueRequest
                            {
                                Name = updateQueueDestinationsRequest.QueueArn,
                                Destinations = queueDestinations,
                            };
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, await gameLiftRequestHandler.UpdateGameSessionQueue(updateQueueDestinationsApiRequest));
                            break;
                        
                        case "UpdateQueueAllowedLocations":
                            var updateQueueAllowedLocationsRequest = JsonConvert.DeserializeObject<ClientMessageUpdateQueueAllowedLocations>(request.Body);
                            var updateQueueAllowedLocationsApiRequest = new UpdateGameSessionQueueRequest
                            {
                                Name = updateQueueAllowedLocationsRequest.QueueArn,
                                FilterConfiguration = new FilterConfiguration
                                {
                                    AllowedLocations = updateQueueAllowedLocationsRequest.AllowedLocations.ToList()
                                },
                            };
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, await gameLiftRequestHandler.UpdateGameSessionQueue(updateQueueAllowedLocationsApiRequest));
                            break;
                        
                        case "GetMatchmakingTicketHeaders":
                            var getDatabaseMatchmakingTicketHeadersRequest = JsonConvert.DeserializeObject<ClientMessageGetMatchmakingTicketHeaders>(request.Body);
                            var matchmakingTicketHeaders = await dynamoDbRequestHandler.GetDatabaseMatchmakingTicketHeaders(getDatabaseMatchmakingTicketHeadersRequest.MatchmakingConfigArn);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingTicketHeaders { TicketHeaders = matchmakingTicketHeaders});
                            break;
                        
                        case "GetMatchmakingTicketHeadersByMatchId":
                            var getDatabaseMatchmakingTicketHeadersByMatchIdRequest = JsonConvert.DeserializeObject<ClientMessageGetMatchmakingTicketHeadersByMatchId>(request.Body);
                            var matchmakingTicketHeadersByMatchId = await dynamoDbRequestHandler.GetDatabaseMatchmakingTicketHeadersByMatchId(getDatabaseMatchmakingTicketHeadersByMatchIdRequest.MatchId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingTicketHeadersByMatchId { TicketHeaders = matchmakingTicketHeadersByMatchId});
                            break;
                        
                        case "GetMatchmakingTicketHeadersBySimulationId":
                            var getDatabaseMatchmakingTicketHeadersBySimulationIdRequest = JsonConvert.DeserializeObject<ClientMessageGetMatchmakingTicketHeadersBySimulationId>(request.Body);
                            var matchmakingTicketHeadersBySimulationId = await dynamoDbRequestHandler.GetDatabaseMatchmakingTicketHeadersByCustomEventData(getDatabaseMatchmakingTicketHeadersBySimulationIdRequest.SimulationId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingTicketHeadersBySimulationId { TicketHeaders = matchmakingTicketHeadersBySimulationId});
                            break;
                        
                        case "GetSimulationMatches":
                            var getDatabaseSimulationMatchesRequest = JsonConvert.DeserializeObject<ClientMessageGetSimulationMatches>(request.Body);
                            var simulationMatchResults = await dynamoDbRequestHandler.GetDatabaseSimulationMatchResults(getDatabaseSimulationMatchesRequest.SimulationId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetSimulationMatches { MatchResults = simulationMatchResults });
                            break;
                        
                        case "GetMatchmakingTicket":
                            var getMatchmakingTicketRequest = JsonConvert.DeserializeObject<ClientMessageGetMatchmakingTicket>(request.Body);
                            var matchmakingTickets = await dynamoDbRequestHandler.GetDatabaseMatchmakingTicket(getMatchmakingTicketRequest.TicketId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingTicket { Ticket = matchmakingTickets});
                            break;

                        case "GetCloudWatchGraph":
                            try
                            {
                                var getCloudWatchGraphRequest = JsonConvert.DeserializeObject<ClientMessageGetCloudWatchGraph>(request.Body);
                                var metricWidgetImage = await cloudWatchRequestHandler.GetWidgetImage(getCloudWatchGraphRequest.MetricWidgetJson);
                                var imageStr = Convert.ToBase64String(metricWidgetImage.ToArray());
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetCloudWatchGraph {Image = imageStr});
                            }
                            catch (Exception e)
                            {
                                LambdaLogger.Log(e.Message);
                            }
                            break;
                        
                        case "GetMatchmakingRuleSets":
                            var matchmakingRuleSets = await gameLiftRequestHandler.GetMatchmakingRulesets();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetMatchmakingRuleSets(){ RuleSets = matchmakingRuleSets});
                            break;
                        
                        case "ValidateMatchmakingRuleSet":
                            var validateMatchmakingRuleSetRequest = JsonConvert.DeserializeObject<ClientMessageValidateMatchmakingRuleSet>(request.Body);
                            LambdaLogger.Log(validateMatchmakingRuleSetRequest.RuleSetBody);
                            var validationResult = await gameLiftRequestHandler.ValidateMatchmakingRuleSet(validateMatchmakingRuleSetRequest.RuleSetBody);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, validationResult);
                            break;
                        
                        case "CreateMatchmakingRuleSet":
                            var createMatchmakingRuleSetRequest = JsonConvert.DeserializeObject<ClientMessageCreateMatchmakingRuleSet>(request.Body);
                            var creationResponse = await gameLiftRequestHandler.CreateMatchmakingRuleset(createMatchmakingRuleSetRequest.RuleSetName, createMatchmakingRuleSetRequest.RuleSetBody);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, creationResponse);
                            break;
                        
                        case "DeleteMatchmakingRuleSet":
                            var deleteMatchmakingRuleSetRequest = JsonConvert.DeserializeObject<ClientMessageDeleteMatchmakingRuleSet>(request.Body);
                            var deletionResponse = await gameLiftRequestHandler.DeleteMatchmakingRuleset(deleteMatchmakingRuleSetRequest.RuleSetName);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, deletionResponse);
                            break;

                        case "GetVirtualPlayers":
                            var getVirtualPlayersRequest = JsonConvert.DeserializeObject<ClientMessageGetVirtualPlayers>(request.Body);
                            var virtualPlayers = await virtualPlayersHandler.GetVirtualPlayers();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetVirtualPlayers { Tasks = virtualPlayers});
                            break;
                        
                        case "GetGameSessionLogs":
                            var getGameSessionLogsRequest = JsonConvert.DeserializeObject<ClientMessageGetGameSessionLogs>(request.Body);
                            var logsResult = await gameLiftRequestHandler.GetGameSessionLogs(getGameSessionLogsRequest.GameSessionId);
                            LambdaLogger.Log("RETURNING " + JsonConvert.SerializeObject(logsResult));
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, logsResult);
                            break;
                        
                        case "GetTaskDefinitions":
                            var taskDefinitions = await virtualPlayersHandler.GetTaskDefinitions();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetTaskDefinitions { TaskDefinitions = taskDefinitions});
                            break;

                        case "LaunchPlayers":
                            var launchPlayersRequest = JsonConvert.DeserializeObject<ClientMessageLaunchPlayers>(request.Body);
                            var result = await virtualPlayersHandler.LaunchPlayers(launchPlayersRequest.NumPlayers,
                                launchPlayersRequest.TaskDefinitionArn, launchPlayersRequest.CapacityProvider);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageLaunchPlayers { Result = result, NumPlayers = launchPlayersRequest.NumPlayers});
                            break;
                        
                        case "TerminateVirtualPlayer":
                            var terminateVirtualPlayerRequest = JsonConvert.DeserializeObject<ClientMessageTerminateVirtualPlayer>(request.Body);
                            var terminateVirtualPlayerErrors = await virtualPlayersHandler.TerminateVirtualPlayer(terminateVirtualPlayerRequest.TaskArn);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageTerminateVirtualPlayer { Errors = terminateVirtualPlayerErrors});
                            break;
                        
                        case "TerminateAllVirtualPlayers":
                            var terminateAllVirtualPlayerErrors = await virtualPlayersHandler.TerminateAllVirtualPlayers();
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageTerminateVirtualPlayer { Errors = terminateAllVirtualPlayerErrors});
                            break;
                        
                        case "AdjustFleetCapacity":
                            var adjustFleetCapacityRequest = JsonConvert.DeserializeObject<ClientMessageAdjustFleetCapacity>(request.Body);
                            var adjustFleetCapacityErrors = await AdjustFleetCapacity(adjustFleetCapacityRequest);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageAdjustFleetCapacityResult{ Errors = adjustFleetCapacityErrors});
                            break;
                        
                        case "UpdateFleetLocations":
                            var updateFleetLocationsRequest = JsonConvert.DeserializeObject<ClientMessageUpdateFleetLocations>(request.Body);
                            var updateFleetLocationsErrors = await UpdateFleetLocations(updateFleetLocationsRequest);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageUpdateFleetLocationsResult{ Errors = updateFleetLocationsErrors});
                            break;
                        
                        case "GetGameSessions":
                            var getGameSessionsRequest = JsonConvert.DeserializeObject<ClientMessageGetGameSessions>(request.Body);
                            var getGameSessionsResult = await dynamoDbRequestHandler.GetDatabaseGameSessions(getGameSessionsRequest.FleetId);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetGameSessions{ GameSessions = getGameSessionsResult});
                            break;
                        
                        case "SetScalingPolicy":
                            var setScalingPolicyRequest = JsonConvert.DeserializeObject<ClientMessageSetScalingPolicy>(request.Body);
                            var setScalingPolicyErrors = await SetScalingPolicy(setScalingPolicyRequest);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageSetScalingPolicy { Errors = setScalingPolicyErrors});
                            break;
                        
                        case "DeleteScalingPolicy":
                            var deleteScalingPolicyRequest = JsonConvert.DeserializeObject<ClientMessageDeleteScalingPolicy>(request.Body);
                            var deleteScalingPolicyErrors = await DeleteScalingPolicy(deleteScalingPolicyRequest);
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageDeleteScalingPolicy { Errors = deleteScalingPolicyErrors});
                            break;
                        
                        case "GetState":
                            var dbStateItem = await GameLiftStateHandler.GetLatestStateDatabaseItem();
                            
                            if (dbStateItem == null) // need to get the state again as a recent version is not in the database
                            {
                                var stateEventDetail = await GameLiftStateHandler.GetStateEventDetail();
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetState { State = stateEventDetail, IsDb = false});
                            }
                            else // return the state object stored in the database
                            {
                                await Utils.SendJsonResponse(_connectionId, stageServiceUrl, new ServerMessageGetState { State = dbStateItem.State, IsDb = true});
                            }
                            
                            await StepFunctions.StartStateMachineExecutionIfNotRunning();
                            break;
                        default:
                            response.Type = "UnknownRequest";
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, response);
                            break;
                    }
                }
                
                return new APIGatewayProxyResponse
                {
                    StatusCode = 200,
                    Body = $"Connected with ID {_connectionId}"
                };
            }
            catch (Exception e)
            {
                return new APIGatewayProxyResponse {
                    StatusCode = 500,
                    Body = $"Failed to connect: {e.Message}"
                };
            }
        }

        private static async Task<List<string>> SetScalingPolicy(ClientMessageSetScalingPolicy message)
        {
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());
            var errors = new List<string>();
            
            try
            {
                var result = await gameLiftRequestHandler.SetScalingPolicy(message);
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }
        
        private static async Task<List<string>> DeleteScalingPolicy(ClientMessageDeleteScalingPolicy message)
        {
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());
            var errors = new List<string>();
            
            try
            {
                var result = await gameLiftRequestHandler.DeleteScalingPolicy(message);
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }
        
        // Change scaling min/desired/max capacity
        private static async Task<List<string>> AdjustFleetCapacity(ClientMessageAdjustFleetCapacity message)
        {
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());
            var errors = new List<string>();

            foreach (var change in message.Changes)
            {
                try
                {
                    var result = await gameLiftRequestHandler.UpdateFleetCapacity(change.FleetId, change.Location, change.Min,
                        change.Desired, change.Max);
                }
                catch (Exception e)
                {
                    errors.Add(e.Message);
                }
            }

            return errors;
        }

        // Modify remote locations for a fleet
        private static async Task<List<string>> UpdateFleetLocations(ClientMessageUpdateFleetLocations message)
        {
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());

            var errors = new List<string>();
            foreach (var change in message.AddedLocations)
            {
                try
                {
                    var result = await gameLiftRequestHandler.CreateFleetLocations(message.FleetId, message.AddedLocations);
                }
                catch (Exception e)
                {
                    errors.Add(e.Message);
                }
            }
            
            foreach (var change in message.RemovedLocations)
            {
                try
                {
                    var result = await gameLiftRequestHandler.DeleteFleetLocations(message.FleetId, message.RemovedLocations);
                }
                catch (Exception e)
                {
                    errors.Add(e.Message);
                }
            }

            return errors;
        }
        
        // Sends a ServerMessage to all active connections in the ManagementService Connections table.
        // Detects connections that have gone away and deletes them
        public static async Task SendToActiveConnections(ServerMessage serverMessage)
        {
            LambdaLogger.Log("TRYING TO SEND TO ACTIVE CONNECTIONS!");
            var dynamoDbClient = new AmazonDynamoDBClient();
            var serviceUrl = Environment.GetEnvironmentVariable("StageServiceUrl");
            var connectionsTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("ConnectionsTableName"));
            var search = connectionsTable.Scan(new ScanFilter());
            do
            {
                var documentList = await search.GetNextSetAsync();
                LambdaLogger.Log("GOT DOCUMENT LIST!");
                LambdaLogger.Log(documentList.Count + " entries in document list!");
                foreach (var document in documentList)
                {
                    LambdaLogger.Log("SENDING TO " + document["ConnectionId"]);
                    var connected = await Utils.SendJsonResponse(document["ConnectionId"], serviceUrl, serverMessage);
                    if (!connected)
                    {
                        // no longer connected - delete from table
                        LambdaLogger.Log(document["ConnectionId"] + " has gone!  Deleting...");
                        await connectionsTable.DeleteItemAsync(document);
                    }
                }
            } while (!search.IsDone);
        }
    }
}