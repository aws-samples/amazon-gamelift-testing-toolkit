// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.GameLift.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Task = System.Threading.Tasks.Task;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public class DynamoDbRequestHandler
    {
        private AmazonDynamoDBClient _client;
        public DynamoDbRequestHandler(AmazonDynamoDBClient client)
        {
            _client = client;
        }
        
        public async Task<List<GameSession>> GetDatabaseGameSessions(string fleetId)
        {
            try
            {
                var gameSessionTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("GameSessionTableName"));

                var fromDate = DateTime.UtcNow - TimeSpan.FromDays(7);
                var filter = new QueryFilter("FleetId", QueryOperator.Equal, fleetId);
                filter.AddCondition("CreationTime", QueryOperator.GreaterThan, fromDate);

                var queryConfig = new QueryOperationConfig
                {
                    IndexName = "Fleet-Date",
                    Filter = filter,
                    BackwardSearch = true,
                };
                
                var search = gameSessionTable.Query(queryConfig);
                
                var documentSet = await search.GetNextSetAsync();
                var results = new List<GameSession>();
                foreach (var document in documentSet)
                {
                    LambdaLogger.Log(document.ToJson());
                    results.Add(JsonConvert.DeserializeObject<GameSession>(document.ToJson()));
                }
                return results;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<GameSession>> GetDatabaseGameSessionsByStatus(string fleetId, string gameSessionStatus)
        {
            try
            {
                var gameSessionTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("GameSessionTableName"));
                
                var filter = new QueryFilter("FleetId", QueryOperator.Equal, fleetId);
                filter.AddCondition("StatusValue", QueryOperator.Equal, gameSessionStatus);

                var queryConfig = new QueryOperationConfig
                {
                    IndexName = "Fleet-StatusValue",
                    Filter = filter,
                    BackwardSearch = true,
                };
                
                var search = gameSessionTable.Query(queryConfig);
                
                var documentSet = await search.GetNextSetAsync();
                var results = new List<GameSession>();
                foreach (var document in documentSet)
                {
                    LambdaLogger.Log(document.ToJson());
                    results.Add(JsonConvert.DeserializeObject<GameSession>(document.ToJson()));
                }
                return results;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<QueuePlacementEventDetail>> GetDatabaseQueueEvents()
        {
            var queueEvents = new List<QueuePlacementEventDetail>();
            try
            {
                var eventLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("EventLogTableName"));
                
                var scanFilter = new ScanFilter();
                scanFilter.AddCondition("detail-type", ScanOperator.Equal, "GameLift Queue Placement Event");

                var config = new ScanOperationConfig()
                {
                    Filter = scanFilter,
                };

                var search = eventLogTable.Scan(config);
                
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        //document.Remove("TimeToLive");
                        var queueEvent = JsonConvert.DeserializeObject<QueuePlacementEvent>(document.ToJson());
                        queueEvents.Add(queueEvent.Detail);
                    }
                } while (!search.IsDone);
                
                queueEvents.Sort((x, y) => String.Compare(x.StartTime, y.StartTime));
                queueEvents.Reverse();
                //queueEvents = queueEvents.Take(50).ToList();
                return queueEvents;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<QueuePlacementEvent> GetDatabaseQueueEventByPlacementId(string placementId)
        {
            try
            {
                var eventLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("EventLogTableName"));

                var filter = new QueryFilter("placementId", QueryOperator.Equal, placementId);

                var queryConfig = new QueryOperationConfig
                {
                    IndexName = "PlacementId-GSI",
                    Filter = filter,
                };
                
                var search = eventLogTable.Query(queryConfig);

                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                QueuePlacementEvent queueEvent = new QueuePlacementEvent();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        //document.Remove("TimeToLive");
                        queueEvent = JsonConvert.DeserializeObject<QueuePlacementEvent>(document.ToJson());
                    }
                } while (!search.IsDone);

                return queueEvent;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<TicketTableDocument>> GetDatabaseMatchmakingTicketHeaders(string matchmakingConfigArn)
        {
            try
            {
                var ticketLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("TicketLogTableName"));

                var filter = new QueryFilter("matchmakingConfigArn", QueryOperator.Equal, matchmakingConfigArn);

                var queryConfig = new QueryOperationConfig
                {
                    IndexName = "TicketConfigTime-GSI",
                    Filter = filter,
                    BackwardSearch = true,
                };
                
                var search = ticketLogTable.Query(queryConfig);
                var tickets = new List<TicketTableDocument>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        //document.Remove("TimeToLive");
                        tickets.Add(context.FromDocument<TicketTableDocument>(document));
                    }
                } while (!search.IsDone);

                return tickets;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<TicketTableDocument>> GetDatabaseMatchmakingTicketHeadersByMatchId(string matchId)
        {
            try
            {
                var ticketLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("TicketLogTableName"));

                var filter = new QueryFilter("matchId", QueryOperator.Equal, matchId);

                var queryConfig = new QueryOperationConfig
                {
                    IndexName = "MatchId-GSI",
                    Filter = filter,
                };
                
                var search = ticketLogTable.Query(queryConfig);
                var tickets = new List<TicketTableDocument>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        //document.Remove("TimeToLive");
                        tickets.Add(context.FromDocument<TicketTableDocument>(document));
                    }
                } while (!search.IsDone);

                return tickets;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        public async Task<List<MatchResultData>> GetDatabaseSimulationMatchResults(string simulationId)
        {
            var simulationResultsTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("SimulationResultsTableName"));
            try
            {

                QueryFilter filter = new QueryFilter("SimulationId", QueryOperator.Equal, simulationId);

                // Use Query overloads that takes the minimum required query parameters.
                Search search = simulationResultsTable.Query(filter);

                var matchResults = new List<MatchResultData>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        //document.Remove("TimeToLive");
                        //matchResults.Add(context.FromDocument<MatchResultData>(document));
                        matchResults.Add(JsonConvert.DeserializeObject<MatchResultData>(document.ToJson()));
                    }
                } while (!search.IsDone);

                return matchResults;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
            return null;
        }
        
        public async Task<MatchmakingSimulationPlayer> GetDatabaseSimulationPlayer(string simulationId, string playerId)
        {
            var simulationPlayersTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("SimulationPlayersTableName"));
            try
            {
                QueryFilter filter = new QueryFilter("SimulationId", QueryOperator.Equal, simulationId);
                filter.AddCondition("PlayerId", QueryOperator.Equal, playerId);

                // Use Query overloads that takes the minimum required query parameters.
                Search search = simulationPlayersTable.Query(filter);

                LambdaLogger.Log("TRYING TO GET PLAYER " + playerId + " FOR simulation " + simulationId);
                var context = new DynamoDBContext(_client);
                var documentList = await search.GetNextSetAsync();
                foreach (var document in documentList)
                {
                    //document.Remove("TimeToLive");
                    LambdaLogger.Log(document.ToJson());
                    var player = JsonConvert.DeserializeObject<MatchmakingSimulationPlayer>(document.ToJson());
                    
                    LambdaLogger.Log(JsonConvert.SerializeObject(player));
                    return player;
                }

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
            return null;
        }
        
            
        public async Task<List<TicketTableDocument>> GetDatabaseMatchmakingTicketHeadersByCustomEventData(string customEventData)
        {
            try
            {
                var ticketLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("TicketLogTableName"));

                var filter = new QueryFilter("customEventData", QueryOperator.Equal, customEventData);

                var queryConfig = new QueryOperationConfig
                {
                    IndexName = "CustomEventDataTime-GSI",
                    Filter = filter,
                };
                
                var search = ticketLogTable.Query(queryConfig);
                var tickets = new List<TicketTableDocument>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        //document.Remove("TimeToLive");
                        tickets.Add(context.FromDocument<TicketTableDocument>(document));
                    }
                } while (!search.IsDone);

                return tickets;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<PlayerProfile>> GetPlayerProfiles()
        {
            try
            {
                var playerProfileTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("PlayerProfileTableName"));

                var search = playerProfileTable.Scan(new ScanOperationConfig());
                
                var playerProfiles = new List<PlayerProfile>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        playerProfiles.Add(JsonConvert.DeserializeObject<PlayerProfile>(document.ToJson()));
                        //document.Remove("TimeToLive");
                        //playerProfiles.Add(context.FromDocument<PlayerProfile>(document));
                    }
                } while (!search.IsDone);

                return playerProfiles;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<LatencyProfile>> GetLatencyProfiles()
        {
            try
            {
                var latencyProfileTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("LatencyProfileTableName"));

                var search = latencyProfileTable.Scan(new ScanOperationConfig());
                
                var latencyProfiles = new List<LatencyProfile>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        latencyProfiles.Add(JsonConvert.DeserializeObject<LatencyProfile>(document.ToJson()));
                        //document.Remove("TimeToLive");
                        //playerProfiles.Add(context.FromDocument<PlayerProfile>(document));
                    }
                } while (!search.IsDone);

                return latencyProfiles;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<List<MatchmakingSimulation>> GetMatchmakingSimulations()
        {
            try
            {
                var matchmakingSimulationsTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("MatchmakingSimulationTableName"));

                var search = matchmakingSimulationsTable.Scan(new ScanOperationConfig());
                
                var simulations = new List<MatchmakingSimulation>();
                var context = new DynamoDBContext(_client);
                List<Document> documentList = new List<Document>();
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        LambdaLogger.Log(document.ToJson());
                        simulations.Add(context.FromDocument<MatchmakingSimulation>(document));
                    }
                } while (!search.IsDone);

                return simulations;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }

        public async Task SavePlayerProfile(PlayerProfile profile)
        {
            var playerProfileTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("PlayerProfileTableName"));

            if (profile.ProfileId == null)
            {
                profile.ProfileId = Guid.NewGuid().ToString();
            }
            
            var item = Document.FromJson(JsonConvert.SerializeObject(profile));

            try
            {
                await playerProfileTable.PutItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
        }
        
        public async Task SaveLatencyProfile(LatencyProfile profile)
        {
            var latencyProfileTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("LatencyProfileTableName"));

            if (profile.ProfileId == null)
            {
                profile.ProfileId = Guid.NewGuid().ToString();
            }
            
            var item = Document.FromJson(JsonConvert.SerializeObject(profile));

            try
            {
                await latencyProfileTable.PutItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
        }
        
        public async Task<MatchmakingSimulation> CreateMatchmakingSimulation(ClientMessageRunMatchmakingSimulation simulationRequest)
        {
            var matchmakingSimulationTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("MatchmakingSimulationTableName"));

            var matchmakingSimulation = new MatchmakingSimulation
            {
                SimulationId = Guid.NewGuid().ToString(),
                Date = DateTime.UtcNow.ToString("u", CultureInfo.GetCultureInfo("en-US")),
                PlayersConfig = simulationRequest.PlayerProfileConfigs.ToList(),
                Status = "Created",
                RuleSet = simulationRequest.RuleSet,
                Tickets = new List<string>(),
                PlayersMatched = 0,
                PlayersFailed = 0,
                MatchesMade = 0,
                MatchesFailed = 0,
                PotentialMatchCreatedEvents = 0,
                MatchmakingSucceededEvents = 0,
                MatchmakingSearchingEvents = 0,
                MatchmakingTimedOutEvents = 0,
                MatchmakingFailedEvents = 0,
                MatchmakingCancelledEvents = 0,
                LastUpdateSent = Utils.GetUnixTimestamp(),
            };

            var item = Document.FromJson(JsonConvert.SerializeObject(matchmakingSimulation));

            try
            {
                await matchmakingSimulationTable.PutItemAsync(item);
                return matchmakingSimulation;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task DeletePlayerProfile(string profileId)
        {
            var playerProfileTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("PlayerProfileTableName"));
            
            var item = new Document();
            item["ProfileId"] = profileId;
            
            try
            {
                await playerProfileTable.DeleteItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
        }
        
        public async Task DeleteLatencyProfile(string profileId)
        {
            var latencyProfileTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("LatencyProfileTableName"));
            
            var item = new Document();
            item["ProfileId"] = profileId;
            
            try
            {
                await latencyProfileTable.DeleteItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
        }

        public async Task<MatchmakingSimulation> GetMatchmakingSimulation(string simulationId)
        {
            var matchmakingSimulationsTable =
                Table.LoadTable(_client, Environment.GetEnvironmentVariable("MatchmakingSimulationTableName"));
            
            var context = new DynamoDBContext(_client);
            
            var item = new Document();
            item["SimulationId"] = simulationId;
            item = await matchmakingSimulationsTable.GetItemAsync(item);
            var simulation = context.FromDocument<MatchmakingSimulation>(item);
            return simulation;
        }

        public async Task<FlexMatchTicket> GetDatabaseMatchmakingTicket(string ticketId)
        {
            var matchmakingEvents = new List<FlexMatchEventDetail>();
            try
            {
                var ticketLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("TicketLogTableName"));
                
                var eventLogTable =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("EventLogTableName"));
                
                var context = new DynamoDBContext(_client);
                
                var item = new Document();
                item["TicketId"] = ticketId;
                item = await ticketLogTable.GetItemAsync(item);
                var ticketDocument = context.FromDocument<TicketTableDocument>(item);
                
                var batchGet = eventLogTable.CreateBatchGet();
                foreach(string ticketEventId in ticketDocument.Events)
                {
                    LambdaLogger.Log("Searching for:" + ticketEventId);
                    batchGet.AddKey(ticketEventId);
                }

                try
                {
                    await batchGet.ExecuteAsync();
                }
                catch (Exception e)
                {
                    LambdaLogger.Log(e.ToString());
                }

                var ticket = new FlexMatchTicket
                {
                    TicketId = ticketDocument.TicketId,
                    Date = ticketDocument.Time,
                    Events = new List<FlexMatchEvent>()
                };
                var ticketEvents = new List<FlexMatchEvent>();
                foreach (var result in batchGet.Results)
                {
                    //ticketEvents.Add(context.FromDocument<FlexMatchEvent>(result));
                    ticket.Events.Add(JsonConvert.DeserializeObject<FlexMatchEvent>(result.ToJson()));
                }

                return ticket;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
        
        public async Task<ConfigTableDocument> GetManagementConfig(string configId)
        {
            try
            {
                var table =
                    Table.LoadTable(_client, Environment.GetEnvironmentVariable("ConfigTableName"));

                var context = new DynamoDBContext(_client);
                
                var item = new Document();
                item["ConfigId"] = configId;
                item = await table.GetItemAsync(item);
                var configTableDocument = context.FromDocument<ConfigTableDocument>(item);

                return configTableDocument;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }

            return null;
        }
    }
}