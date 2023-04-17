// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon.GameLift;
using Amazon.GameLift.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;
using AttributeValue = Amazon.DynamoDBv2.Model.AttributeValue;

namespace ManagementConsoleBackend.ManagementService
{
    public class FlexMatchSimulator
    {
        public async Task<bool> FlexMatchSimulatorHandler(Stream stream, ILambdaContext context)
        {
            LambdaLogger.Log("STARTING SIMULATION");
            string requestStr;
            using (StreamReader reader = new StreamReader(stream))
            {
                requestStr = reader.ReadToEnd();
            }
            
            LambdaLogger.Log(requestStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(context));
            var simulation = JsonConvert.DeserializeObject<MatchmakingSimulation>(requestStr);
            
            LambdaLogger.Log(JsonConvert.SerializeObject(simulation));

            var flexMatchSimulatorArn = Environment.GetEnvironmentVariable("FlexMatchSimulatorArn");
            
            var gameLiftRequestHandler = new GameLiftRequestHandler(new AmazonGameLiftClient());
            
            var errors = new List<string>();
            var prepareErrors = await gameLiftRequestHandler.PrepareMatchmakerForSimulation(flexMatchSimulatorArn, simulation);
            if (prepareErrors.Count > 0)
            {
                return false;
            }

            var dynamoDbClient = new AmazonDynamoDBClient();
            
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            var simulationPlayersTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("SimulationPlayersTableName"));
            var playerBatch = simulationPlayersTable.CreateBatchWrite();
            
            LambdaLogger.Log("GOT PLAYERS TABLE!");
            var playerProfiles = await dynamoDbRequestHandler.GetPlayerProfiles();
            var latencyProfiles = await dynamoDbRequestHandler.GetLatencyProfiles();
            var players = new List<Player>();
            var playersByTimeDelay = new Dictionary<int, List<Player>>();

            var playerNum = 0;

            foreach (var playerProfileConfig in simulation.PlayersConfig) // loop through the player configs for the simulation
            {
                if (playersByTimeDelay.ContainsKey(playerProfileConfig.TimeDelay) == false)
                {
                    playersByTimeDelay.Add(playerProfileConfig.TimeDelay, new List<Player>());
                }
                var profile = playerProfiles.Find(x => x.ProfileId == playerProfileConfig.ProfileId); // find the profile definition
                var latencyProfile = latencyProfiles.Find(x => x.ProfileId == playerProfileConfig.LatencyProfileId); // find the latency profile definition

                if (profile != null)
                {
                    for (var i = 0; i < playerProfileConfig.NumPlayers; i++)
                    {
                        playerNum++;
                        var player = new Player
                        {
                            PlayerId = Guid.NewGuid().ToString(),
                        };
                        
                        if (!String.IsNullOrEmpty(profile.Team))
                        {
                            player.Team = profile.Team;
                        }
                        var playerAttributes = new Dictionary<string, Amazon.GameLift.Model.AttributeValue>();
                        
                        foreach (var attribute in profile.Attributes)
                        {
                            playerAttributes[attribute.AttributeName] = new Amazon.GameLift.Model.AttributeValue();
                            if (attribute.AttributeType == "S")
                            {
                                var att = attribute as PlayerStringAttribute;
                                if (att != null)
                                {
                                    playerAttributes[att.AttributeName].S = att.Value;
                                }
                            }
                            else if (attribute.AttributeType == "N" && attribute.ValueType=="value")
                            {
                                var att = attribute as PlayerNumberAttribute;
                                if (att != null)
                                {
                                    playerAttributes[att.AttributeName].N = att.Value;
                                }
                            }
                            else if (attribute.AttributeType == "N" && attribute.ValueType == "randomInteger")
                            {
                                var att = attribute as PlayerRandIntegerAttribute;
                                if (att != null)
                                {
                                    playerAttributes[att.AttributeName].N = Utils.RandomInt(att.Min, att.Max);
                                }
                            }
                            else if (attribute.AttributeType == "N" && attribute.ValueType == "randomDouble")
                            {
                                var att = attribute as PlayerRandDoubleAttribute;
                                if (att != null)
                                {
                                    playerAttributes[att.AttributeName].N = Utils.RandomDouble(att.Min, att.Max);
                                }
                            }
                            else if (attribute.AttributeType == "SL" && attribute.ValueType == "value")
                            {
                                var att = attribute as PlayerStringListAttribute;
                                if (att != null)
                                {
                                    playerAttributes[att.AttributeName].SL = att.Value.ToList();
                                }
                            }
                            else if (attribute.AttributeType == "SL" && attribute.ValueType == "randomStringList")
                            {
                                var att = attribute as PlayerRandStringListAttribute;
                                if (att != null)
                                {
                                    var numStrings = Utils.RandomInt(att.Min, att.Max);
                                    att.Value.Shuffle();
                                    playerAttributes[att.AttributeName].SL = att.Value.ToList().GetRange(0, numStrings);
                                }
                            }
                            else if (attribute.AttributeType == "SDM")
                            {
                                var att = attribute as PlayerDoubleMapAttribute;
                                if (att != null)
                                {
                                    playerAttributes[att.AttributeName].SDM = att.ValueMap;
                                }
                            }
                        }

                        player.PlayerAttributes = playerAttributes;
                        
                        if (latencyProfile != null)
                        {
                            foreach (var regionLatency in latencyProfile.LatencyData)
                            {
                                var numLatencyMs = Utils.RandomInt(regionLatency.MinLatency, regionLatency.MaxLatency);
                                player.LatencyInMs.Add(regionLatency.Region, numLatencyMs);
                            }
                        }

                        LambdaLogger.Log(JsonConvert.SerializeObject(player));
                        players.Add(player);
                        playersByTimeDelay[playerProfileConfig.TimeDelay].Add(player);

                        try
                        {
                            var matchmakingPlayer = new MatchmakingSimulationPlayer
                            {
                                SimulationId = simulation.SimulationId,
                                PlayerId = player.PlayerId,
                                ProfileId = profile.ProfileId,
                                ProfileName = profile.Name,
                                PlayerData = player,
                                TimeDelay = playerProfileConfig.TimeDelay,
                            };

                            if (latencyProfile != null)
                            {
                                matchmakingPlayer.LatencyProfileId = latencyProfile.ProfileId;
                                matchmakingPlayer.LatencyProfileName = latencyProfile.Name;
                            }

                            playerBatch.AddDocumentToPut(
                                Document.FromJson(JsonConvert.SerializeObject(matchmakingPlayer)));
                        }
                        catch (Exception e)
                        {
                            LambdaLogger.Log(e.Message);
                        }
                    }
                }
            }

            // store generated player in SimulationPlayers table
            try
            {
                await playerBatch.ExecuteAsync();
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }

            var timeDelays = playersByTimeDelay.Keys.ToList();
            var secondsPassed = 0;
            var maxTimeDelay = timeDelays.Max();

            while (secondsPassed <= maxTimeDelay)
            {
                if (playersByTimeDelay.ContainsKey(secondsPassed))
                {
                    LambdaLogger.Log(DateTime.Now.ToLongTimeString() + " REQUESTING " + playersByTimeDelay[secondsPassed].Count + " PLAYERS");
                    var matchErrors = await StartMatching(playersByTimeDelay[secondsPassed], gameLiftRequestHandler, flexMatchSimulatorArn, simulation.SimulationId);
                    if (matchErrors.Count>0)
                    {
                        var updateRequest = new UpdateItemRequest
                        {
                            TableName = Environment.GetEnvironmentVariable("MatchmakingSimulationTableName"),
                            Key = new Dictionary<string, AttributeValue>()
                                {{"SimulationId", new AttributeValue {S = simulation.SimulationId }}},
                            UpdateExpression = "SET #status = :status, #errors = :errors",
                            ExpressionAttributeNames = new Dictionary<string, string>
                            {
                                {"#status", "Status"},
                                {"#errors", "Errors"},
                            },
                            ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                            {
                                {":status", new AttributeValue {S = "Failed"}},
                                {":errors", new AttributeValue {SS = matchErrors}},
                            }
                        };
                        LambdaLogger.Log("SIMULATION FAILED");
                        try
                        {
                            await dynamoDbClient.UpdateItemAsync(updateRequest);
                        }
                        catch (Exception e)
                        {
                            LambdaLogger.Log(e.Message);
                        }
                        break;
                    }
                }
                System.Threading.Thread.Sleep(1000);
                secondsPassed++;
            }

            LambdaLogger.Log("ENDING SIMULATION!");

            return true;
        }
    
        private async Task<List<string>> StartMatching(List<Player> players, GameLiftRequestHandler gameLiftRequestHandler, string flexMatchSimulatorArn, string simulationId)
        {
            var errors = new List<string>();
            
            players.Shuffle();
            
            try
            {
                foreach (var player in players)
                {
                    errors.AddRange(await gameLiftRequestHandler.StartMatchmaking(flexMatchSimulatorArn, player));
                    if (errors.Count > 0)
                    {
                        LambdaLogger.Log(errors[0]);
                    }
                    System.Threading.Thread.Sleep(50);
                }
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                errors.Add(e.Message);
            }

            return errors;
        }
        
               
        public async Task<bool> HandleSimulatorFlexMatchEvent(FlexMatchEvent flexMatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();

            var updateRequest = new UpdateItemRequest
            {
                TableName = Environment.GetEnvironmentVariable("MatchmakingSimulationTableName"),
                Key = new Dictionary<string, AttributeValue>()
                    {{"SimulationId", new AttributeValue {S = flexMatchEvent.Detail.CustomEventData}}},
                UpdateExpression = "SET #eventType = #eventType + :incr",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                {
                    {":incr", new AttributeValue {N = "1"}},
                }
            };

            switch (flexMatchEvent.Detail.Type)
            {
                case "PotentialMatchCreated":
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "PotentialMatchCreatedEvents");
                    break;
                
                case "MatchmakingSearching":
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingSearchingEvents");
                    break; 
                
                case "MatchmakingTimedOut":

                    updateRequest.UpdateExpression += ", #matchesFailed = #matchesFailed + :incr, #playersFailed = #playersFailed + :playersFailed";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingTimedOutEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersFailed", "PlayersFailed");
                    updateRequest.ExpressionAttributeNames.Add("#matchesFailed", "MatchesFailed");
                    updateRequest.ExpressionAttributeValues.Add(":playersFailed", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    break; 

                case "MatchmakingFailed":
                    updateRequest.UpdateExpression += ", #matchesFailed = #matchesFailed + :incr, #playersFailed = #playersFailed + :playersFailed";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingFailedEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersFailed", "PlayersFailed");
                    updateRequest.ExpressionAttributeValues.Add(":playersFailed", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    updateRequest.ExpressionAttributeNames.Add("#matchesFailed", "MatchesFailed");
                    break; 
                
                case "MatchmakingCancelled":
                    updateRequest.UpdateExpression += ", #matchesFailed = #matchesFailed + :incr, #playersFailed = #playersFailed + :playersFailed";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingCancelledEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersFailed", "PlayersFailed");
                    updateRequest.ExpressionAttributeNames.Add("#matchesFailed", "MatchesFailed");
                    updateRequest.ExpressionAttributeValues.Add(":playersFailed", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    break; 
                
                case "MatchmakingSucceeded":
                    updateRequest.UpdateExpression += ", #matchesMade = #matchesMade + :incr, #playersMatched = #playersMatched + :playersMatched";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingSucceededEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersMatched", "PlayersMatched");
                    updateRequest.ExpressionAttributeNames.Add("#matchesMade", "MatchesMade");
                    updateRequest.ExpressionAttributeValues.Add(":playersMatched", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    break;                    
            }
            
            try
            {
                await dynamoDbClient.UpdateItemAsync(updateRequest);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }

            await StoreSimulationResult(flexMatchEvent);
            
            return true;

        }
        
        private async Task<bool> StoreSimulationResult(FlexMatchEvent flexMatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            
            var simulationResultsTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("SimulationResultsTableName"));

            var result = new MatchResultData();
            var playerTickets = new Dictionary<string, FlexMatchEventTicket>();
            
            result.SimulationId = flexMatchEvent.Detail.CustomEventData;
            
            result.Date = flexMatchEvent.Time.ToString("s")+"Z";
            result.MatchId = flexMatchEvent.Detail.MatchId ?? "No Match-" + flexMatchEvent.Id;
            
            if (flexMatchEvent.Detail.Tickets != null)
            {
                foreach (var ticket in flexMatchEvent.Detail.Tickets)
                {
                    playerTickets.Add(ticket.Players[0].PlayerId, ticket);
                }
            }

            if (flexMatchEvent.Detail.Type == "PotentialMatchCreated")
            {
                result.RuleEvaluationMetrics = flexMatchEvent.Detail.RuleEvaluationMetrics;
                result.MatchedSuccessfully = true;
            }
            else
            {
                result.MatchedSuccessfully = false;
            }

            if (flexMatchEvent.Detail.Type == "PotentialMatchCreated" 
                || flexMatchEvent.Detail.Type == "MatchmakingTimedOut" 
                || flexMatchEvent.Detail.Type == "MatchmakingFailed" 
                || flexMatchEvent.Detail.Type == "MatchmakingCancelled")
            {
                result.MatchTicketStatus = flexMatchEvent.Detail.Type;
                
                if (flexMatchEvent.Detail.GameSessionInfo != null)
                {
                    result.NumPlayers = flexMatchEvent.Detail.GameSessionInfo.Players.Count;
                    result.Players = new List<MatchmakingSimulationPlayer>();

                    foreach (var player in flexMatchEvent.Detail.GameSessionInfo.Players)
                    {
                        var playerData = await dynamoDbRequestHandler.GetDatabaseSimulationPlayer(result.SimulationId, player.PlayerId);
                        playerData.StartMatchTime = playerTickets[player.PlayerId].StartTime.ToUnixTimeSeconds();
                        playerData.EndMatchTime = flexMatchEvent.Time.ToUnixTimeSeconds();
                        playerData.TicketId = playerTickets[player.PlayerId].TicketId;
                        playerData.MatchedTeam = player.Team;
                        playerData.MatchedSuccessfully = flexMatchEvent.Detail.Type == "PotentialMatchCreated";
                        result.Players.Add(playerData);
                    }
                }
                
                try
                {
                    var item = Document.FromJson(JsonConvert.SerializeObject(result));
                    await simulationResultsTable.PutItemAsync(item);
                }
                catch (Exception e)
                {
                    LambdaLogger.Log(e.Message);
                }
            }
            else
            {
                return false;
            }

            return true;
        }
    }
}