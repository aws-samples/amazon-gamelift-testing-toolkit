// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.GameLift;
using Amazon.GameLift.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Newtonsoft.Json;
using SampleGameBackend.Common;
using SampleGameBackend.GameClientService.Data;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace SampleGameBackend.GameClientService
{
    public class GameClientService
    {
        private APIGatewayProxyRequest _request;
        private ILambdaContext _context;
        private string _connectionId;
        //private string _endpoint;
        private ClientMessage _body;
        
        // GameClientService main handler to service websocket requests from game clients
        public async Task<APIGatewayProxyResponse> GameClientServiceHandler(APIGatewayProxyRequest request, ILambdaContext context)
        {
            _request = request;
            _context = context;
            
            var stageServiceUrl = Environment.GetEnvironmentVariable("StageServiceUrl");
            
            LambdaLogger.Log(JsonSerializer.Serialize(_request));
            try
            {
                _connectionId = request.RequestContext.ConnectionId;
                var eventType = request.RequestContext.EventType;
                var domainName = request.RequestContext.DomainName;
                var stage = request.RequestContext.Stage;
                //_endpoint = $"https://{domainName}/{stage}";
                
                if (eventType == "MESSAGE")
                {
                    if (request.Body == "/ping")
                    {
                        LambdaLogger.Log("Ping received!");
                        return new APIGatewayProxyResponse
                        {
                            StatusCode = 200,
                            Body = $"Connected with ID {_connectionId}"
                        };
                    }
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

                    var response = new ServerMessage
                    {
                        PlayerId = _body.PlayerId,
                    };
                    switch (_body.Type)
                    {
                        case "StartMatchmaking":
                            await StartMatchMaking(_body);
                            response.Type = "GameRequested";
                            await Utils.SendJsonResponse(_connectionId, stageServiceUrl, response);
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

        // FlexMatch event handler - triggered by EventBridge, only processes final matchmaking events
        public async Task FlexMatchEventHandler(Stream stream, ILambdaContext context)
        {
            string requestStr;
            using (StreamReader reader = new StreamReader(stream))
            {
                requestStr = reader.ReadToEnd();
            }
            
            LambdaLogger.Log(requestStr);
            var flexMatchEvent = JsonConvert.DeserializeObject<FlexMatchEvent>(requestStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(flexMatchEvent, Formatting.Indented, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            }));

            switch (flexMatchEvent?.Detail.Type)
            {
                // only interested in final Matchmaking events
                case "MatchmakingTimedOut":
                case "MatchmakingFailed":
                case "MatchmakingCancelled":
                case "MatchmakingSucceeded":
                    await HandleMatchmakingResult(flexMatchEvent);
                    break;
                default:
                    break;
            }
        }
        
        // Updates existing matchmaking ticket in DynamoDB and sends info back to players in the ticket
        private async Task HandleMatchmakingResult(FlexMatchEvent flexmatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var stageServiceUrl = Environment.GetEnvironmentVariable("StageServiceUrl");
            if (flexmatchEvent?.Detail?.Tickets?.Count > 0)
            {
                foreach (var ticket in flexmatchEvent.Detail.Tickets)
                {
                    if (ticket.TicketId.StartsWith("auto-backfill"))
                    {
                        LambdaLogger.Log("Skipping auto backfill ticket");
                        continue;
                    }
                    
                    // Lookup ticket
                    Table ticketsTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("MatchmakingTicketsTableName"));
                    var item = await ticketsTable.GetItemAsync(ticket.TicketId);
                    
                    var serverMessage = new ServerMessage
                    {
                        PlayerId = item["PlayerId"],
                        Type = flexmatchEvent.Detail.Type
                    };
                    
                    item["Result"] = flexmatchEvent.Detail.Type;

                    if (flexmatchEvent.Detail.Type == "MatchmakingSucceeded")
                    {
                        item["MatchId"] = flexmatchEvent.Detail.MatchId;
                        item["GameSessionInfo"] = Document.FromJson(JsonConvert.SerializeObject(flexmatchEvent.Detail.GameSessionInfo));
                        serverMessage.IpAddress = flexmatchEvent.Detail.GameSessionInfo.IPAddress;
                        serverMessage.Port = flexmatchEvent.Detail.GameSessionInfo.Port;

                        foreach (var player in flexmatchEvent.Detail.GameSessionInfo.Players)
                        {
                            if (player.PlayerId == item["PlayerId"])
                            {
                                serverMessage.SessionId = player.PlayerSessionId;
                            }
                        }
                    }
                    else
                    {
                        item["Message"] = flexmatchEvent.Detail.Message;
                        serverMessage.Message = flexmatchEvent.Detail.Message;
                    }
                    LambdaLogger.Log(item.ToJson());
                    await ticketsTable.PutItemAsync(item);

                    await Utils.SendJsonResponse(item["ConnectionId"], stageServiceUrl, serverMessage);
                }
            }
        }
        
        // Triggers FlexMatch matchmaking and stores the response and connection info in DynamoDB
        private async Task StartMatchMaking(ClientMessage body)
        {
            var gameLiftClient = new AmazonGameLiftClient();
            var stageServiceUrl = Environment.GetEnvironmentVariable("StageServiceUrl");
            var response = await gameLiftClient.StartMatchmakingAsync(new StartMatchmakingRequest
            {
                ConfigurationName =  Environment.GetEnvironmentVariable("MatchmakingConfigurationName"),
                Players = new List<Player>
                {
                    new Player
                    {
                        PlayerId = body.PlayerId,
                    }
                } 
            });

            LambdaLogger.Log(JsonConvert.SerializeObject(response));

            var dynamoDbClient = new AmazonDynamoDBClient();
            Table ticketsTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("MatchmakingTicketsTableName"));
            var item = Document.FromJson(JsonConvert.SerializeObject(response.MatchmakingTicket));
            item["Status"] = response.MatchmakingTicket.Status.Value;
            item["StageServiceUrl"] = stageServiceUrl;
            item["ConnectionId"] = _connectionId;
            item["PlayerId"] = _body.PlayerId;
            item["TimeToLive"] = (Utils.GetUnixTimestamp() + 7200);
            /*item["TicketId"] = response.MatchmakingTicket.TicketId;
            item["Status"] = response.MatchmakingTicket.Status.Value;
            item["StartTime"] = response.MatchmakingTicket.StartTime;
            item["ConnectionId"] = _connectionId;*/
            //item["StartTime"] = response.MatchmakingTicket.StartTime;
            await ticketsTable.PutItemAsync(item);
        }

    }
}
