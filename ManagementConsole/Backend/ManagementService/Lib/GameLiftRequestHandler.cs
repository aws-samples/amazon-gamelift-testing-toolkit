// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.GameLift;
using Amazon.GameLift.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.ManagementService.Data;
using Microsoft.VisualBasic.FileIO;
using Newtonsoft.Json;
using SearchOption = System.IO.SearchOption;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public class GameLiftRequestHandler
    {
        private AmazonGameLiftClient _client;
        public GameLiftRequestHandler(AmazonGameLiftClient client)
        {
            _client = client;
        }

        public async Task<List<string>> GetFleetIds()
        {
            var fleetsPaginator = _client.Paginators.ListFleets(new ListFleetsRequest());
            try
            {
                var fleetIds = new List<string>();
                await foreach (var fleetId in fleetsPaginator.FleetIds)
                {
                    fleetIds.Add(fleetId);
                }

                return fleetIds;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<FleetCapacity>> GetFleetCapacities()
        {
            var fleetsAttributes = await GetFleetAttributes();
            var fleetIds = new List<string>();

            foreach (var fleet in fleetsAttributes)
            {
                if (fleet.ComputeType == ComputeType.EC2)
                {
                    fleetIds.Add(fleet.FleetId);
                }
            }

            try
            {
                var fleetCapacitiesPaginator = _client.Paginators.DescribeFleetCapacity(new DescribeFleetCapacityRequest
                {
                    FleetIds = fleetIds
                });

                var fleetCapacities = new List<FleetCapacity>();
                await foreach (var fleetCapacity in fleetCapacitiesPaginator.FleetCapacity)
                {
                    fleetCapacities.Add(fleetCapacity);
                }
            
                return fleetCapacities;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<Alias>> GetAliases()
        {
            try
            {
                var aliases = new List<Alias>();
                var aliasesPaginator = _client.Paginators.ListAliases(new ListAliasesRequest
                {

                });

                await foreach (var alias in aliasesPaginator.Aliases)
                {
                    aliases.Add(alias);
                }

                return aliases;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<GameSessionQueue> GetGameSessionQueue(string queueArn)
        {
            try
            {
                var queueResponse = await _client.DescribeGameSessionQueuesAsync(
                    new DescribeGameSessionQueuesRequest
                    {
                        Names = new List<string>
                        {
                            queueArn
                        }
                    });

                if (queueResponse.GameSessionQueues.Count > 0)
                {
                    return queueResponse.GameSessionQueues[0];
                }

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }

            return null;
        }
        
        public async Task<List<GameSessionQueue>> GetGameSessionQueues()
        {
            var gameSessionQueues = new List<GameSessionQueue>();
            try
            {
                var gameSessionQueuesPaginator = _client.Paginators.DescribeGameSessionQueues(
                    new DescribeGameSessionQueuesRequest
                    {

                    });
            
                await foreach (var gameSessionQueue in gameSessionQueuesPaginator.GameSessionQueues)
                {
                    gameSessionQueues.Add(gameSessionQueue);
                }

                return gameSessionQueues;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<MatchmakingConfiguration>> GetMatchmakingConfigurations()
        {
            var matchmakingConfigurations = new List<MatchmakingConfiguration>();
            try
            {
                var matchmakingConfigurationsPaginator = _client.Paginators.DescribeMatchmakingConfigurations(
                    new DescribeMatchmakingConfigurationsRequest
                    {

                    });
            
                await foreach (var matchmakingConfiguration in matchmakingConfigurationsPaginator.Configurations)
                {
                    matchmakingConfigurations.Add(matchmakingConfiguration);
                }

                return matchmakingConfigurations;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<MatchmakingRuleSet>> GetMatchmakingRulesets()
        {
            var matchmakingRuleSets = new List<MatchmakingRuleSet>();
            try
            {
                var matchmakingRuleSetsPaginator = _client.Paginators.DescribeMatchmakingRuleSets(
                    new DescribeMatchmakingRuleSetsRequest
                    {

                    });
            
                await foreach (var matchmakingRuleSet in matchmakingRuleSetsPaginator.RuleSets)
                {
                    matchmakingRuleSets.Add(matchmakingRuleSet);
                }

                return matchmakingRuleSets;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<ServerMessageValidateMatchmakingRuleSet> ValidateMatchmakingRuleSet(string ruleSetBody)
        {
            var validateRuleSetResponse = new ServerMessageValidateMatchmakingRuleSet
            {
                Validated = false,
            };
            try
            {
                var validationResponse = await _client.ValidateMatchmakingRuleSetAsync(new ValidateMatchmakingRuleSetRequest
                {
                    RuleSetBody = ruleSetBody
                });

                if (validationResponse.Valid)
                {
                    validateRuleSetResponse.Validated = true;
                }

            }
            catch (Exception e)
            {
                validateRuleSetResponse.ErrorMessage = e.Message;
            }

            return validateRuleSetResponse;
        }

        public async Task<List<string>> StartMatchmaking(string matchmakingConfigurationArn, Player player)
        {
            var errors = new List<string>();
            try
            {
                var players = new List<Player>();
                players.Add(player);
                var response = await _client.StartMatchmakingAsync(new StartMatchmakingRequest
                {
                    ConfigurationName = matchmakingConfigurationArn,
                    Players = players
                });

                LambdaLogger.Log(response.MatchmakingTicket.TicketId);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                errors.Add(e.Message);
            }

            return errors;
        }
        public async Task<List<string>> PrepareMatchmakerForSimulation(string matchmakingConfigurationArn, MatchmakingSimulation simulation)
        {
            var errors = new List<string>();
            try
            {
                await _client.UpdateMatchmakingConfigurationAsync(new UpdateMatchmakingConfigurationRequest
                {
                    CustomEventData = simulation.SimulationId,
                    Name = matchmakingConfigurationArn,
                    RuleSetName = simulation.RuleSet,
                });

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                errors.Add(e.Message);
            }

            return errors;
        }

        public async Task<ServerMessageCreateMatchmakingRuleSet> CreateMatchmakingRuleset(string ruleSetName, string ruleSetBody)
        {
            var result = new ServerMessageCreateMatchmakingRuleSet();
            try
            {
                var creationResponse = await _client.CreateMatchmakingRuleSetAsync(new CreateMatchmakingRuleSetRequest
                {
                    Name = ruleSetName,
                    RuleSetBody = ruleSetBody
                });

                result.RuleSet = creationResponse.RuleSet;
                result.Created = true;
                return result;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                result.Created = false;
                result.ErrorMessage = e.Message;
                return result;
            }
        }
        
        public async Task<ServerMessageDeleteMatchmakingRuleSet> DeleteMatchmakingRuleset(string ruleSetName)
        {
            var result = new ServerMessageDeleteMatchmakingRuleSet();
            try
            {
                var deletionResponse = await _client.DeleteMatchmakingRuleSetAsync(new DeleteMatchmakingRuleSetRequest
                {
                    Name = ruleSetName,
                });
                
                result.Deleted = true;
                return result;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                result.Deleted = false;
                result.ErrorMessage = e.Message;
                return result;
            }
        }
        
        public async Task<ServerMessageUpdateMatchmakingConfiguration> UpdateMatchmakingConfiguration(UpdateMatchmakingConfigurationRequest request)
        {
            var result = new ServerMessageUpdateMatchmakingConfiguration();
            try
            {
                var updateMatchmakingConfigurationResponse = await _client.UpdateMatchmakingConfigurationAsync(request);
                result.Configuration = updateMatchmakingConfigurationResponse.Configuration;
                result.Updated = true;
                return result;
            }
            catch (Exception e)
            {
                result.Updated = false;
                result.ErrorMessage = e.Message;
                LambdaLogger.Log(e.ToString());
                return result;
            }
        }
        
        public async Task<ServerMessageUpdateGameSessionQueue> UpdateGameSessionQueue(UpdateGameSessionQueueRequest request)
        {
            LambdaLogger.Log("UPDATE GAME SESSION QUEUE!");
            LambdaLogger.Log(JsonConvert.SerializeObject(request));
            var result = new ServerMessageUpdateGameSessionQueue();
            try
            {
                var updateGameSessionQueueResponse = await _client.UpdateGameSessionQueueAsync(request);
                result.UpdatedQueue = updateGameSessionQueueResponse.GameSessionQueue;
                result.Updated = true;
                return result;
            }
            catch (Exception e)
            {
                result.Updated = false;
                result.ErrorMessage = e.Message;
                LambdaLogger.Log(e.ToString());
                return result;
            }
        }
        
        public async Task<List<ScalingPolicy>> GetScalingPolicies(string fleetId)
        {
            var scalingPolicies = new List<ScalingPolicy>();
            try
            {
                var scalingPoliciesPaginator = _client.Paginators.DescribeScalingPolicies(
                    new DescribeScalingPoliciesRequest
                    {
                        FleetId = fleetId
                    });

                await foreach (var scalingPolicy in scalingPoliciesPaginator.ScalingPolicies)
                {
                    scalingPolicies.Add(scalingPolicy);
                }

                return scalingPolicies;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }


        
        public async Task<RuntimeConfiguration> GetRuntimeConfiguration(string fleetId)
        {
            try
            {
                var runtimeConfiguration = await _client.DescribeRuntimeConfigurationAsync(
                    new DescribeRuntimeConfigurationRequest()
                    {
                        FleetId = fleetId
                    });

                return runtimeConfiguration.RuntimeConfiguration;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<UpdateFleetCapacityResponse> UpdateFleetCapacity(string fleetId, string location, int minInstances, int desiredInstances, int maxInstances)
        {
            var fleetCapacityResponse = await _client.UpdateFleetCapacityAsync(
                new UpdateFleetCapacityRequest 
                {
                    FleetId = fleetId,
                    Location = location,
                    MinSize = minInstances,
                    MaxSize = maxInstances,
                    DesiredInstances = desiredInstances
                });
            
            return fleetCapacityResponse;
        }
        
        public async Task<PutScalingPolicyResponse> SetScalingPolicy(ClientMessageSetScalingPolicy message)
        {
            var putScalingPolicyResponse = await _client.PutScalingPolicyAsync(
                    new PutScalingPolicyRequest 
                    {
                        FleetId = message.FleetId,
                        MetricName = message.MetricName,
                        Name = message.Name,
                        TargetConfiguration = message.TargetConfiguration,
                        Threshold = message.Threshold,
                        PolicyType = message.PolicyType,
                    });
            
            return putScalingPolicyResponse;
        }
        
        public async Task<DeleteScalingPolicyResponse> DeleteScalingPolicy(ClientMessageDeleteScalingPolicy message)
        {
            var deleteScalingPolicyResponse = await _client.DeleteScalingPolicyAsync(
                new DeleteScalingPolicyRequest 
                {
                    FleetId = message.FleetId,
                    Name = message.Name,
                });
            
            return deleteScalingPolicyResponse;
        }

        public async Task<List<OutputLogEvent>> GetGameSessionCloudWatchLogs(string logStream)
        {
            var events = new List<OutputLogEvent>();
            var request = new GetLogEventsRequest
            {
                LogGroupName = "/gameserver-logs/",
                LogStreamName = logStream,
            };
            try
            {
                var logsClient = new AmazonCloudWatchLogsClient();
                /* for some reason this seems to time out
                 var logsPaginator = logsClient.Paginators.GetLogEvents(request);

                await foreach (var logEvent in logsPaginator.Events)
                {
                    LambdaLogger.Log(JsonConvert.SerializeObject(logEvent));
                    events.Add(logEvent);
                }*/
                var eventResponse = await logsClient.GetLogEventsAsync(request);

                return eventResponse.Events;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<ServerMessageGetGameSessionLogs> GetGameSessionLogs(string gameSessionId)
        {
            var events = new List<OutputLogEvent>();
            var response = new ServerMessageGetGameSessionLogs();
            response.LogEvents = new List<string>();
            response.LogFiles = new Dictionary<string, List<string>>();
            
            var request = new GetGameSessionLogUrlRequest
            {
                GameSessionId = gameSessionId
            };

            try
            {
                var logOutputFile = "/tmp/logs.zip";
                var logFolder = "/tmp/logs-" + DateTime.Now.ToString("yyyyMMdd-HHmmss");

                var gameSessionLogUrlResponse = await _client.GetGameSessionLogUrlAsync(request);
                var logUrl = gameSessionLogUrlResponse.PreSignedUrl;
                using (var client = new HttpClient())
                {
                    LambdaLogger.Log("DOWNLOADING " + gameSessionLogUrlResponse.PreSignedUrl);
                    using (var s = await client.GetStreamAsync(gameSessionLogUrlResponse.PreSignedUrl))
                    {
                        using (var fs = new FileStream(logOutputFile, FileMode.Create))
                        {
                            await s.CopyToAsync(fs);
                        }
                    }
                    LambdaLogger.Log("DOWNLOADED!");
                }
                
                LambdaLogger.Log("CREATING FOLDER " + logFolder);
                FileSystem.CreateDirectory(logFolder);
                LambdaLogger.Log("UNZIPPING");
                System.IO.Compression.ZipFile.ExtractToDirectory(logOutputFile, logFolder);
                LambdaLogger.Log("UNZIPPED");
                foreach (string file in Directory.EnumerateFiles(logFolder, "*.*", SearchOption.AllDirectories))
                {
                    LambdaLogger.Log("FOUND LOG FILE " + file);
                    response.LogFiles.Add(file, File.ReadAllLines(file).ToList());
                }
                return response;
            }
            catch (Exception e)
            {
                response.ErrorMessage = e.Message;
                return response;
            }

        }

        public async Task<CreateFleetLocationsResponse> CreateFleetLocations(string fleetId, string[] locations)
        {
            var request = new CreateFleetLocationsRequest
            {
                FleetId = fleetId,
                Locations = new List<LocationConfiguration>()
            };

            foreach (var location in locations)
            {
                request.Locations.Add(new LocationConfiguration
                {
                    Location = location
                });
            }

            return await _client.CreateFleetLocationsAsync(request);
        }
        
        public async Task<DeleteFleetLocationsResponse> DeleteFleetLocations(string fleetId, string[] locations)
        {
            var request = new DeleteFleetLocationsRequest
            {
                FleetId = fleetId,
                Locations = new List<string>()
            };

            foreach (var location in locations)
            {
                request.Locations.Add(location);
            }

            return await _client.DeleteFleetLocationsAsync(request);
        }
        
        public async Task<GameSession> GetGameSession(string gameSessionId)
        {
            var request = new DescribeGameSessionsRequest
            {
                GameSessionId = gameSessionId
            };
            
            try
            {
                var gameSessionsResponse = await _client.DescribeGameSessionsAsync(request);
                return gameSessionsResponse.GameSessions[0];
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<GameSession>> GetGameSessions(string fleetId, string statusFilter=null)
        {
            var gameSessions = new List<GameSession>();
            
            var request = new DescribeGameSessionsRequest
            {
                FleetId = fleetId
            };

            if (statusFilter != null)
            {
                request.StatusFilter = statusFilter;
            }

            try
            {
                var gameSessionsPaginator = _client.Paginators.DescribeGameSessions(request);

                await foreach (var gameSession in gameSessionsPaginator.GameSessions)
                {
                    gameSessions.Add(gameSession);
                }

                return gameSessions;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<PlayerSession>> GetPlayerSessions(string gameSessionId)
        {
            try
            {
                var playerSessions = new List<PlayerSession>();
                var playerSessionsPaginator = _client.Paginators.DescribePlayerSessions(new DescribePlayerSessionsRequest
                {
                    GameSessionId = gameSessionId
                });
                    
                await foreach (var playerSession in playerSessionsPaginator.PlayerSessions)
                {
                    playerSessions.Add(playerSession);
                }

                return playerSessions;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<FleetCapacity>> GetFleetLocationCapacities(string fleetId)
        {
            var locationAttributes = await GetFleetLocationAttributes(fleetId);

            var instances = new List<Instance>();
            var locationCapacities = new List<FleetCapacity>();
            foreach (var locationAttribute in locationAttributes)
            {
                var locationCapacity =
                    await GetFleetLocationCapacity(fleetId, locationAttribute.LocationState.Location);
                locationCapacities.Add(locationCapacity);
            }

            return locationCapacities;
        }
        
        public async Task<List<LocationAttributes>> GetFleetLocationAttributes(string fleetId)
        {
            var fleetLocationAttributes = new List<LocationAttributes>();
            try
            {
                var fleetLocationsAttributesPaginator = _client.Paginators.DescribeFleetLocationAttributes(new DescribeFleetLocationAttributesRequest
                {
                    FleetId = fleetId
                });

                await foreach (var fleetLocationAttributesResponse in fleetLocationsAttributesPaginator.Responses)
                {
                    fleetLocationAttributes.AddRange(fleetLocationAttributesResponse.LocationAttributes);
                }

                return fleetLocationAttributes;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<FleetCapacity> GetFleetLocationCapacity(string fleetId, string location)
        {
            try
            {
                var response = await _client.DescribeFleetLocationCapacityAsync(new DescribeFleetLocationCapacityRequest
                {
                    FleetId = fleetId,
                    Location = location
                });

                return response.FleetCapacity;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<Event>> GetFleetEvents(string fleetId, int limit=5000)
        {
            var fleetEvents = new List<Event>();
            try
            {
                var fleetEventsRequest = new DescribeFleetEventsRequest
                {
                    FleetId = fleetId,
                };

                var fleetEventsPaginator = _client.Paginators.DescribeFleetEvents(fleetEventsRequest);

                var numEvents = 0;
                await foreach (var fleetEvent in fleetEventsPaginator.Events)
                {
                    fleetEvents.Add(fleetEvent);
                    numEvents++;
                    if (numEvents >= limit)
                    {
                        break;
                    }
                }

                return fleetEvents;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
            
        }
        
        public async Task<List<Instance>> GetFleetInstances(string fleetId, string location=null)
        {
            var fleetInstances = new List<Instance>();
            var request = new DescribeInstancesRequest
            {
                FleetId = fleetId
            };

            if (location != null)
            {
                request.Location = location;
            }
            
            try
            {
                var instancesPaginator = _client.Paginators.DescribeInstances(request);
                await foreach (var instance in instancesPaginator.Instances)
                {
                    fleetInstances.Add(instance);
                }

                return fleetInstances;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<FleetUtilization>> GetFleetsUtilizations(List<string> fleetIds)
        {
            var fleetUtilizations = new List<FleetUtilization>();
            
            try
            {
                var fleetUtilizationPaginator = _client.Paginators.DescribeFleetUtilization(
                    new DescribeFleetUtilizationRequest
                    {
                        FleetIds = fleetIds
                    });
            
                await foreach (var fleetUtilization in fleetUtilizationPaginator.FleetUtilization)
                {
                    fleetUtilizations.Add(fleetUtilization);
                }

                return fleetUtilizations;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<FleetUtilization> GetFleetUtilization(string fleetId)
        {
            try
            {
                var fleetUtilizationPaginator = _client.Paginators.DescribeFleetUtilization(
                    new DescribeFleetUtilizationRequest
                    {
                        FleetIds = new List<string> { fleetId }
                    });
            
                await foreach (var fleetUtilization in fleetUtilizationPaginator.FleetUtilization)
                {
                    return fleetUtilization;
                }

                return null;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<FleetAttributes>> GetFleetsAttributes(List<string> fleetIds)
        {
            var fleetAttributes = new List<FleetAttributes>();
            try
            {
                var fleetAttributesPaginator = _client.Paginators.DescribeFleetAttributes(
                    new DescribeFleetAttributesRequest
                    {
                        FleetIds = fleetIds
                    });
            
                await foreach (var fleetAttribute in fleetAttributesPaginator.FleetAttributes)
                {
                    fleetAttributes.Add(fleetAttribute);
                }

                return fleetAttributes;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<FleetAttributes> GetFleetAttributes(string fleetId)
        {
            try
            {
                var fleetAttributesPaginator = _client.Paginators.DescribeFleetAttributes(new DescribeFleetAttributesRequest
                {
                    FleetIds = new List<string> {fleetId},
                });
            
                await foreach (var fleetAttributes in fleetAttributesPaginator.FleetAttributes)
                {
                    return fleetAttributes;
                }

                return null;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<FleetAttributes>> GetFleetAttributes()
        {
            try
            {
                var fleetAttributesPaginator = _client.Paginators.DescribeFleetAttributes(new DescribeFleetAttributesRequest());
                var fleetAttributesList = new List<FleetAttributes>();
                await foreach (var fleetAttributes in fleetAttributesPaginator.FleetAttributes)
                {
                    fleetAttributesList.Add(fleetAttributes);
                }
                return fleetAttributesList;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
    }
}