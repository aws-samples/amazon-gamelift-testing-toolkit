// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.ECS;
using Amazon.Lambda.Core;
using Amazon.Scheduler;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService;

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
        var eventStr = Utils.ReadEventStream(stream);
        LambdaLogger.Log(eventStr);

        var schedulerHandler = new SchedulerHandler(new AmazonSchedulerClient());
        var schedules = await schedulerHandler.GetSchedules();
            
        var dynamoDbRequestHandler = new DynamoDbRequestHandler(new AmazonDynamoDBClient());
        var virtualPlayersHandler = new VirtualPlayersHandler(new AmazonECSClient());
        try
        {
            var actionInput = JsonConvert.DeserializeObject<ScheduledActionInput>(eventStr);

            if (actionInput != null)
            {
                LambdaLogger.Log(actionInput.Type);
                LambdaLogger.Log(actionInput.LaunchId);
                    
                if (actionInput.Type == "Launch")
                {
                    // check if this schedule is still meant to be active
                    if (schedules.LaunchSchedule.State == ScheduleState.DISABLED)
                    {
                        LambdaLogger.Log("SCHEDULE DISABLED");
                        return false;
                    }
                        
                    var scheduleInput = JsonConvert.DeserializeObject<ScheduledActionInput>(schedules.LaunchSchedule.Target.Input);
                        
                    if (scheduleInput==null || scheduleInput.LaunchId != actionInput.LaunchId)
                    {
                        LambdaLogger.Log("THIS REQUEST IS FOR AN OLD LAUNCH SCHEDULE - EXITING...");
                        return false;
                    }
                }

                var scheduleLaunchRequest = await dynamoDbRequestHandler.GetLaunchRequest(actionInput.LaunchId);
                LambdaLogger.Log(JsonConvert.SerializeObject(scheduleLaunchRequest));

                for (var i = 0; i < scheduleLaunchRequest.Schedule.Actions.Count; i++)
                {
                    if (scheduleLaunchRequest.Schedule.Actions[i].Status != "Scheduled" || scheduleLaunchRequest.Schedule.Actions[i].Type != actionInput.Type)
                    {
                        continue;
                    }
                    var currentAction = scheduleLaunchRequest.Schedule.Actions[i];
                    scheduleLaunchRequest.Schedule.Actions[i].StartedTime = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                    scheduleLaunchRequest.Schedule.Actions[i].Status = "Executing";
                    await dynamoDbRequestHandler.SaveLaunchRequest(scheduleLaunchRequest);
                            
                    switch (currentAction.Type)
                    {
                        case "Launch":
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

                            break;
                        }
                        case "Terminate":
                        {
                            var errors = await virtualPlayersHandler.TerminateVirtualPlayerTasksByLaunchIdTag(scheduleLaunchRequest.LaunchId);
                            scheduleLaunchRequest.Schedule.Actions[i].Status = errors.Count == 0 ? "Completed" : "Failed";
                            break;
                        }
                    }
                            
                    scheduleLaunchRequest.Schedule.Actions[i].EndedTime = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                    await dynamoDbRequestHandler.SaveLaunchRequest(scheduleLaunchRequest);
                            
                    await ManagementService.SendToActiveConnections(new ServerMessageScheduleProgress
                    {
                        Schedule = scheduleLaunchRequest.Schedule,
                        ActionIndex = i,
                    });
                            
                    break;
                }

                var remainingLaunchTasks = scheduleLaunchRequest.Schedule.Actions.FindAll(x => x.Status == "Scheduled" && x.Type == "Launch").Count;
                var remainingTerminateTasks = scheduleLaunchRequest.Schedule.Actions.FindAll(x => x.Status == "Scheduled" && x.Type == "Terminate").Count;

                if (remainingLaunchTasks != 0 && remainingTerminateTasks != 0)
                {
                    return true;
                }
                
                // disable schedule
                if (remainingLaunchTasks == 0)
                {
                    LambdaLogger.Log("DISABLING LAUNCH SCHEDULE");
                    await schedulerHandler.DisableSchedule(schedules.LaunchSchedule);
                }

                if (remainingTerminateTasks != 0)
                {
                    return true;
                }
                    
                LambdaLogger.Log("DISABLING TERMINATE SCHEDULE");
                await schedulerHandler.DisableSchedule(schedules.TerminateSchedule);

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
}