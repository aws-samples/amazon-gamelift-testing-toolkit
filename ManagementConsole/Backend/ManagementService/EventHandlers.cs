// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService
{
    public class EventHandlers
    {
        /// <summary>Handles custom EventBridge state events generated by the Step Functions poller</summary>
        public async Task StateEventHandler(Stream stream, ILambdaContext context)
        {
            var eventStr = ReadEventStream(stream);
            
            LambdaLogger.Log(eventStr);
            var stateEvent = JsonConvert.DeserializeObject<GameLiftStateEvent>(eventStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(stateEvent, Formatting.Indented, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            }));

            var serverMessage = new ServerMessageGetState
            {
                State = stateEvent?.Detail,
                IsDb = false,
            };

            await ManagementService.SendToActiveConnections(serverMessage);
        }
        
        /// <summary>Handles GameLift Queue placement events and stores them in DDB</summary>
        public async Task QueuePlacementEventHandler(Stream stream, ILambdaContext context)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var eventStr = ReadEventStream(stream);

            LambdaLogger.Log(eventStr);
            var queuePlacementEvent = JsonConvert.DeserializeObject<QueuePlacementEvent>(eventStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(queuePlacementEvent, Formatting.Indented,
                new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore
                }));

            var eventLogTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("EventLogTableName"));

            LambdaLogger.Log(queuePlacementEvent.Time.DateTime.ToString("yyyy-MM-ddTHH:mm:ss"));
            
            try
            {
                var item = Document.FromJson(eventStr);
                item["date"] = queuePlacementEvent.Time.DateTime.ToString("yyyy-MM-dd");
                item["time-id"] = queuePlacementEvent.Time.DateTime.ToString("yyyy-MM-ddTHH:mm:ss") + "-" + queuePlacementEvent.Id;
                item["placementId"] = queuePlacementEvent.Detail.PlacementId;
                item["TimeToLive"] = (Utils.GetUnixTimestamp() + (86400 * 7));
                await eventLogTable.PutItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }

            await this.HandleQueueEvent(queuePlacementEvent);
        }
        
        private async Task<bool> HandleQueueEvent(QueuePlacementEvent queuePlacementEvent)
        {
            // TODO - improve batch up event handling
            await ManagementService.SendToActiveConnections(new ServerMessageQueuePlacementEvent
            {
                QueuePlacementEventDetail = queuePlacementEvent.Detail,
                Resources = queuePlacementEvent.Resources
            });

            return true;
        }

        /// <summary>Handles FlexMatch events and stores them in DDB</summary>
        public async Task FlexMatchEventHandler(Stream stream, ILambdaContext context)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var eventStr = ReadEventStream(stream);

            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            var configDocument = await dynamoDbRequestHandler.GetManagementConfig("mainConfig");

            LambdaLogger.Log(eventStr);
            var flexMatchEvent = JsonConvert.DeserializeObject<FlexMatchEvent>(eventStr);
            
            LambdaLogger.Log(JsonConvert.SerializeObject(flexMatchEvent, Formatting.Indented, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            }));
            
            await StoreFlexMatchEvent(eventStr, flexMatchEvent);
            
            // handle FlexMatch Simulator events
            if (flexMatchEvent.Resources[0] == configDocument.FlexMatchSimulatorArn)
            {
                var flexMatchSimulator = new FlexMatchSimulator();
                LambdaLogger.Log("RECEIVED FLEXMATCH SIMULATOR EVENT!");
                await flexMatchSimulator.HandleSimulatorFlexMatchEvent(flexMatchEvent);
                LambdaLogger.Log("FINISHED PROCESSING FLEXMATCH SIMULATOR EVENT!");
            }
            else
            {
                LambdaLogger.Log("RECEIVED FLEXMATCH EVENT!");
                await HandleFlexMatchEvent(flexMatchEvent);
                LambdaLogger.Log("FINISHED PROCESSING FLEXMATCH EVENT!");
            }
        }

        private async Task<bool> HandleFlexMatchEvent(FlexMatchEvent flexMatchEvent)
        {
            // TODO - improve batch up event handling
            await ManagementService.SendToActiveConnections(new ServerMessageFlexMatchEvent
            {
                FlexMatchEventDetail = flexMatchEvent.Detail,
                Resources = flexMatchEvent.Resources
            });

            return true;
        }

        private async Task<bool> StoreFlexMatchEvent(string eventStr, FlexMatchEvent flexMatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var timeToLive = (Utils.GetUnixTimestamp() + (86400 * 7));
            
            foreach (var ticket in flexMatchEvent.Detail.Tickets)
            {
                // add event id to ticket log table
                var updateRequest = new UpdateItemRequest
                {
                    TableName = Environment.GetEnvironmentVariable("TicketLogTableName"),
                    Key = new Dictionary<string, AttributeValue>() {{"TicketId", new AttributeValue {S = ticket.TicketId}}},
                    UpdateExpression = "ADD #events :eventId SET #time = :startTime, #matchmakingConfigArn = :matchmakingConfigArn, #timeToLive = :timeToLive",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        {"#events", "events"},
                        {"#time", "time"},
                        {"#matchmakingConfigArn", "matchmakingConfigArn"},
                        {"#timeToLive", "TimeToLive"},
                        
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                    {
                        {":eventId",new AttributeValue { SS = {flexMatchEvent.Id.ToString()}}},
                        {":startTime",new AttributeValue { S = ticket.StartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }},
                        {":matchmakingConfigArn",new AttributeValue { S = flexMatchEvent.Resources[0] }},
                        {":timeToLive", new AttributeValue { N = timeToLive.ToString() }},
                    },
                };

                switch (flexMatchEvent.Detail.Type)
                {
                    case "MatchmakingTimedOut":
                    case "MatchmakingFailed":
                    case "MatchmakingCancelled":
                    case "MatchmakingSucceeded":
                        updateRequest.UpdateExpression =
                            "ADD #events :eventId SET #time = :startTime, #lastEventType = :eventType, #matchmakingConfigArn = :matchmakingConfigArn, #timeToLive = :timeToLive";
                        updateRequest.ExpressionAttributeNames.Add("#lastEventType", "lastEventType");
                        updateRequest.ExpressionAttributeValues.Add(":eventType", new AttributeValue { S = flexMatchEvent.Detail.Type });
                        
                        // add matchId if set
                        if (flexMatchEvent.Detail.MatchId != null)
                        {
                            updateRequest.UpdateExpression += ", #matchId = :matchId";
                            updateRequest.ExpressionAttributeNames.Add("#matchId", "matchId");
                            updateRequest.ExpressionAttributeValues.Add(":matchId",new AttributeValue { S = flexMatchEvent.Detail.MatchId });
                        }
                        break;                    
                }
                
                if (!String.IsNullOrEmpty(flexMatchEvent.Detail.CustomEventData))
                {
                    updateRequest.UpdateExpression += ", #customEventData = :customEventData";
                    updateRequest.ExpressionAttributeNames.Add("#customEventData", "customEventData");
                    updateRequest.ExpressionAttributeValues.Add(":customEventData", new AttributeValue { S = flexMatchEvent.Detail.CustomEventData });
                }

                try
                {
                    await dynamoDbClient.UpdateItemAsync(updateRequest);
                }
                catch (Exception e)
                {
                    LambdaLogger.Log(e.Message);
                }
            }
            
            // add event to eventlog table
            var eventLogTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("EventLogTableName"));
            
            try
            {
                var item = Document.FromJson(eventStr);
                item["date"] = flexMatchEvent.Time.DateTime.ToString("yyyy-MM-dd");
                item["time-id"] = flexMatchEvent.Time.DateTime.ToString("s")+"Z" + "-" + flexMatchEvent.Id;
                item["TimeToLive"] = timeToLive;
                LambdaLogger.Log("SAVING:" + JsonConvert.SerializeObject(item));
                await eventLogTable.PutItemAsync(item);
                LambdaLogger.Log("SAVED!");
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }
            return true;
        }

        private string ReadEventStream(Stream stream)
        {
            string eventStr;
            using (StreamReader reader = new StreamReader(stream))
            {
                eventStr = reader.ReadToEnd();
            }

            return eventStr;
        }

    }

}