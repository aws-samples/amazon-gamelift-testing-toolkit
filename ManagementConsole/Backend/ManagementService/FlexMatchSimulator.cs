// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.GameLift;
using Amazon.GameLift.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

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
                    await StartMatching(playersByTimeDelay[secondsPassed], gameLiftRequestHandler, flexMatchSimulatorArn);
                }
                System.Threading.Thread.Sleep(1000);
                secondsPassed++;
            }

            LambdaLogger.Log("ENDING SIMULATION!");

            return true;
        }
    
        private async Task<bool> StartMatching(List<Player> players, GameLiftRequestHandler gameLiftRequestHandler, string flexMatchSimulatorArn)
        {
            var errors = new List<string>();
            
            players.Shuffle();
            
            try
            {
                foreach (var player in players)
                {
                    errors = await gameLiftRequestHandler.StartMatchmaking(flexMatchSimulatorArn, player);
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

            return true;
        }
    }
    
}