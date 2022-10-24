// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.EventBridge;
using Amazon.EventBridge.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.StepFunctions;
using Amazon.StepFunctions.Model;
using KellermanSoftware.CompareNetObjects;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService
{
    public class StepFunctions
    {
        /// <summary>Main state poller function.  Polls GameLift and compares the result to stored state in DDB.  If there are differences or 15 minutes have elapsed, sends the state as a custom event to EventBridge and stores in DDB</summary>
        public async Task<object> StatePollHandler(APIGatewayProxyRequest request, ILambdaContext context)
        {
            var client = new AmazonEventBridgeClient();
            var dynamoDbClient = new AmazonDynamoDBClient();
            var stateEventDetail = await GameLiftStateHandler.GetStateEventDetail();

            // get last stored state from DDB
            var databaseStateItem = await GameLiftStateHandler.GetLatestStateDatabaseItem();
            var comparisonConfig = new ComparisonConfig
            {
                IgnoreObjectTypes = true,
                MaxDifferences = 20,
                MaxStructDepth = 5,
                MembersToIgnore = new string[] { "PreSignedLogUrl" }.ToList()
            };

            var compareLogic = new CompareLogic(comparisonConfig);
            var comparisonResult = compareLogic.Compare(databaseStateItem?.State, stateEventDetail);
            //LambdaLogger.Log(comparisonResult.DifferencesString);
            //LambdaLogger.Log(JsonConvert.SerializeObject(comparisonResult.Differences));

            // remove this data to stop Differences from bloating in size
            foreach (var comparisonResultDifference in comparisonResult.Differences)
            {
                comparisonResultDifference.ParentObject1 = null;
                comparisonResultDifference.ParentObject2 = null;
            }
            var fifteenMinutesAgo = DateTime.UtcNow - TimeSpan.FromMinutes(15);

            // send + store event if database event 15 minutes old, or there are differences
            if (comparisonResult.Differences.Count > 0 || databaseStateItem?.Time < fifteenMinutesAgo)
            {
                var entry = new PutEventsRequestEntry
                {
                    Source = "CustomGameLift",
                    EventBusName = Environment.GetEnvironmentVariable("EventBusName"),
                    Detail = JsonConvert.SerializeObject(stateEventDetail),
                    DetailType = "CustomGameLift.GameLiftState"
                };
                //LambdaLogger.Log(JsonConvert.SerializeObject(entry));
                var putEventsResponse = await client.PutEventsAsync(new PutEventsRequest
                {
                    Entries = new List<PutEventsRequestEntry> {entry}
                });
            
                var stateLogTable = Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("StateLogTableName"));

                var differencesDocument = Document.FromJson(JsonConvert.SerializeObject(new {
                    Differences = comparisonResult.Differences
                }));

                var dbItem = new GameLiftStateDatabaseItem
                {
                    State = stateEventDetail,
                    Differences = comparisonResult.Differences,
                    TimeToLive = (Utils.GetUnixTimestamp() + (86400*7)),
                };
                
                var item = Document.FromJson(JsonConvert.SerializeObject(dbItem));
                item["Date"] = DateTime.UtcNow.Date;
                item["Time"] = DateTime.UtcNow;
                await stateLogTable.PutItemAsync(item);
                LambdaLogger.Log(JsonConvert.SerializeObject(putEventsResponse));
            }

            return new { PollAgain = true, PollFrequency = 15 };
        }
        
        public async Task<object> GameSessionPollHandler(APIGatewayProxyRequest request, ILambdaContext context)
        {
            await GameLiftStateHandler.UpdateGameSessions();
            return new { PollAgain = true, PollFrequency = 15 };
        }

        /// <summary>Function checks if zero running executions, and starts one if not</summary>
        ///
        public static async Task StartStateMachineExecutionIfNotRunning()
        {
            try
            {
                var sfnClient = new AmazonStepFunctionsClient();
                var listExecutionsResult = await sfnClient.ListExecutionsAsync(new ListExecutionsRequest
                {
                    StateMachineArn = Environment.GetEnvironmentVariable("StateMachineArn"),
                    StatusFilter = ExecutionStatus.RUNNING
                });

                if (listExecutionsResult.Executions.Count == 0)
                {
                    await sfnClient.StartExecutionAsync(new StartExecutionRequest
                    {
                        StateMachineArn = Environment.GetEnvironmentVariable("StateMachineArn")
                    });
                }

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
            
            try
            {
                var sfnClient = new AmazonStepFunctionsClient();
                var listExecutionsResult = await sfnClient.ListExecutionsAsync(new ListExecutionsRequest
                {
                    StateMachineArn = Environment.GetEnvironmentVariable("GameSessionPollerStateMachineArn"),
                    StatusFilter = ExecutionStatus.RUNNING
                });
                
                if (listExecutionsResult.Executions.Count == 0)
                {
                    await sfnClient.StartExecutionAsync(new StartExecutionRequest
                    {
                        StateMachineArn = Environment.GetEnvironmentVariable("GameSessionPollerStateMachineArn")
                    });
                }

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
            }
        }
        
        /// <summary>Simple count function to count iterations of the state machine</summary>
        public object StepFunctionIteratorHandler(Stream stream, ILambdaContext context)
        {
            string requestStr;
            using (StreamReader reader = new StreamReader(stream))
            {
                requestStr = reader.ReadToEnd();
            }
            
            LambdaLogger.Log(requestStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(context));
            var inputEvent = JsonConvert.DeserializeObject<dynamic>(requestStr);
            int index = inputEvent?.Iterator.Index;
            int step = inputEvent?.Iterator.Step;
            int count = inputEvent?.Iterator.Count;

            index += step;
            
            var result = new
            {
                Index = index,
                Count = count,
                Step = step,
                Continue = (index < count)
                
            };
            LambdaLogger.Log(JsonConvert.SerializeObject(result));
            return result;
        }
        
        /// <summary>Starts a new Step Functions execution for a given State Machine</summary>
        public async Task<object> StepFunctionRestartHandler(Stream stream, ILambdaContext context)
        {
            string requestStr;
            using (var reader = new StreamReader(stream))
            {
                requestStr = reader.ReadToEnd();
            }
            var inputEvent = JsonConvert.DeserializeObject<dynamic>(requestStr);

            try
            {
                var sfnClient = new AmazonStepFunctionsClient();
                await sfnClient.StartExecutionAsync(new StartExecutionRequest
                {
                    StateMachineArn = inputEvent?.StateMachine.Id
                });
            
                var result = new
                {
                    sfnRestarted = true
                };
                return result;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
    }
}