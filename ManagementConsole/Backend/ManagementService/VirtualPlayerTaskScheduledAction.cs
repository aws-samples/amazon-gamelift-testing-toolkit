// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.ECS;
using Amazon.EventBridge;
using Amazon.EventBridge.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Scheduler;
using Amazon.StepFunctions;
using Amazon.StepFunctions.Model;
using KellermanSoftware.CompareNetObjects;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService
{
    public class ScheduledActionInput
    {
        public string LaunchId;
        public string Type;
    }
    
    public class VirtualPlayerTaskScheduledAction
    {
        /// <summary>
        /// Lookup schedule and perform task/launch termination accordingly
        /// </summary>
        public async Task<bool> ScheduledActionHandler(Stream stream, ILambdaContext context)
        {
            var eventStr = ReadEventStream(stream);
            LambdaLogger.Log(eventStr);
            
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(new AmazonDynamoDBClient());
            var virtualPlayersHandler = new VirtualPlayersHandler(new AmazonECSClient());
            try
            {
                var actionInput = JsonConvert.DeserializeObject<ScheduledActionInput>(eventStr);

                if (actionInput != null)
                {
                    LambdaLogger.Log(actionInput.Type);
                    LambdaLogger.Log(actionInput.LaunchId);

                    var scheduleLaunchRequest = await dynamoDbRequestHandler.GetLaunchRequest(actionInput.LaunchId);
                    LambdaLogger.Log(JsonConvert.SerializeObject(scheduleLaunchRequest));

                    for (var i = 0; i < scheduleLaunchRequest.Schedule.Actions.Count; i++)
                    {
                        if (scheduleLaunchRequest.Schedule.Actions[i].Status == "Scheduled" && scheduleLaunchRequest.Schedule.Actions[i].Type==actionInput.Type)
                        {
                            var currentAction = scheduleLaunchRequest.Schedule.Actions[i];
                            scheduleLaunchRequest.Schedule.Actions[i].ExecutedTime = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                            
                            if (currentAction.Type == "Launch")
                            {
                                var launchTaskRequest = await virtualPlayersHandler.LaunchPlayers(currentAction.NumTasks,
                                    scheduleLaunchRequest.TaskDefinitionArn, scheduleLaunchRequest.CapacityProvider, null, null, scheduleLaunchRequest);


                                if (launchTaskRequest != null)
                                {
                                    scheduleLaunchRequest.Schedule.Actions[i].Status = "Completed";
                                    scheduleLaunchRequest.Schedule.Actions[i].LaunchId = launchTaskRequest.LaunchId;
                                }
                                else
                                {
                                    scheduleLaunchRequest.Schedule.Actions[i].Status = "Failed";
                                }

                                await dynamoDbRequestHandler.SaveLaunchRequest(scheduleLaunchRequest);
                            }
                            else if (currentAction.Type == "Terminate")
                            {
                                var errors = await virtualPlayersHandler.TerminateVirtualPlayerTasksByLaunchIdTag(scheduleLaunchRequest.LaunchId);
                                if (errors.Count == 0)
                                {
                                    scheduleLaunchRequest.Schedule.Actions[i].Status = "Completed";
                                }
                                else
                                {
                                    scheduleLaunchRequest.Schedule.Actions[i].Status = "Failed";
                                }
                                await dynamoDbRequestHandler.SaveLaunchRequest(scheduleLaunchRequest);
                            }
                            
                            await ManagementService.SendToActiveConnections(new ServerMessageScheduleProgress
                            {
                                Schedule = scheduleLaunchRequest.Schedule,
                                ActionIndex = i,
                            });
                            
                            break;
                        }
                    }

                    var remainingLaunchTasks = scheduleLaunchRequest.Schedule.Actions.FindAll(x => x.Status == "Scheduled" && x.Type == "Launch").Count;
                    var remainingTerminateTasks = scheduleLaunchRequest.Schedule.Actions.FindAll(x => x.Status == "Scheduled" && x.Type == "Terminate").Count;

                    if (remainingLaunchTasks==0 || remainingTerminateTasks==0)
                    {
                        // disable schedule
                        var schedulerHandler = new SchedulerHandler(new AmazonSchedulerClient());
                        var schedules = await schedulerHandler.GetSchedules();
                        if (remainingLaunchTasks == 0)
                        {
                            LambdaLogger.Log("DISABLING LAUNCH SCHEDULE");
                            await schedulerHandler.DisableSchedule(schedules.LaunchSchedule);
                        }
                        if (remainingTerminateTasks == 0)
                        {
                            LambdaLogger.Log("DISABLING TERMINATE SCHEDULE");
                            await schedulerHandler.DisableSchedule(schedules.TerminateSchedule);
                        }

                    }

                    if (scheduleLaunchRequest.Schedule.Actions.FindAll(x => x.Status == "Scheduled" && x.Type=="Terminate").Count == 0)
                    {
                        // disable terminate schedule
                    }

                    
                    return true;
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }

            return false;
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