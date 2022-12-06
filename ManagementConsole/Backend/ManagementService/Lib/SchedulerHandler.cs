// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Linq;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Scheduler;
using Amazon.Scheduler.Model;
using ManagementConsoleBackend.ManagementService.Data;
using Newtonsoft.Json;
using ResourceNotFoundException = Amazon.Scheduler.Model.ResourceNotFoundException;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public class SchedulerSchedules
    {
        public GetScheduleGroupResponse ScheduleGroup;
        public GetScheduleResponse LaunchSchedule;
        public GetScheduleResponse TerminateSchedule;
    }
    
    public class ScheduleTimes
    {
        public DateTime LaunchScheduleStart;
        public DateTime LaunchScheduleEnd;
        public DateTime TerminateScheduleStart;
    }

    public class SchedulerHandler
    {
        private const string ScheduleGroupName = "Amazon-GameLift-Testing-Toolkit-Schedule-Group";
        private const string LaunchScheduleName = "Virtual-Player-Tasks-Launch";
        private const string TerminateScheduleName = "Virtual-Player-Tasks-Terminate";

        private AmazonSchedulerClient _client;

        public SchedulerHandler(AmazonSchedulerClient client)
        {
            _client = client;
        }

        public async Task<ScheduleTimes> UpdateSchedules(SchedulerSchedules schedules, VirtualPlayerLaunchRequest launchRequest)
        {
            var response = new ScheduleTimes();
            var currentMinute = DateTime.UtcNow;
            currentMinute = currentMinute.AddSeconds(-currentMinute.Second);

            LambdaLogger.Log("CURRENT MINUTE IS" + currentMinute.ToString("yyyy-MM-ddTHH:mm:ss"));

            var startLaunchMinute = currentMinute.AddMinutes(1);
            var endLaunchMinute = startLaunchMinute.AddMinutes(launchRequest.Schedule.LaunchTime);
            var startTerminateMinute = endLaunchMinute.AddMinutes(launchRequest.Schedule.TerminationTime);
            
            LambdaLogger.Log("SHOULD START LAUNCH AT " + startLaunchMinute.ToString("yyyy-MM-ddTHH:mm:ss"));
            LambdaLogger.Log("SHOULD END LAUNCH AT " + endLaunchMinute.ToString("yyyy-MM-ddTHH:mm:ss"));
            LambdaLogger.Log("SHOULD TERMINATE AT " + startTerminateMinute.ToString("yyyy-MM-ddTHH:mm:ss"));

            try
            {
                var terminationTarget = schedules.TerminateSchedule.Target;
                terminationTarget.Input = JsonConvert.SerializeObject(new
                {
                    LaunchId = launchRequest.LaunchId,
                    Type = "Terminate"
                });
                var updateTerminateScheduleRequest = new UpdateScheduleRequest
                {
                    State = ScheduleState.ENABLED,
                    FlexibleTimeWindow = new FlexibleTimeWindow
                    {
                        Mode = FlexibleTimeWindowMode.OFF,
                    },
                    GroupName = schedules.TerminateSchedule.GroupName,
                    Name = schedules.TerminateSchedule.Name,
                    Target = terminationTarget,
                    ScheduleExpression = "at(" + startTerminateMinute.ToString("yyyy-MM-ddTHH:mm:ss") + ")",
                };
                LambdaLogger.Log(JsonConvert.SerializeObject(updateTerminateScheduleRequest));
                await _client.UpdateScheduleAsync(updateTerminateScheduleRequest);
                response.TerminateScheduleStart = startTerminateMinute;

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                return null;
            }
            
            try
            {
                var launchTarget = schedules.TerminateSchedule.Target;
                launchTarget.Input = JsonConvert.SerializeObject(new
                {
                    LaunchId = launchRequest.LaunchId,
                    Type = "Launch"
                });
                
                var updateLaunchScheduleRequest = new UpdateScheduleRequest
                {
                    StartDate = startLaunchMinute,
                    EndDate = endLaunchMinute,
                    State = ScheduleState.ENABLED,
                    FlexibleTimeWindow = new FlexibleTimeWindow
                    {
                        Mode = FlexibleTimeWindowMode.OFF,
                    },
                    GroupName = schedules.LaunchSchedule.GroupName,
                    Name = schedules.LaunchSchedule.Name,
                    Target = launchTarget,
                    ScheduleExpression = "rate(" + launchRequest.Schedule.SchedulePeriodMinutes + " minute)",
                };
                LambdaLogger.Log(JsonConvert.SerializeObject(updateLaunchScheduleRequest));
                await _client.UpdateScheduleAsync(updateLaunchScheduleRequest);
                response.LaunchScheduleStart = startLaunchMinute;
                response.LaunchScheduleEnd = endLaunchMinute;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                return null;
            }

            return response;
        }
        
        public async Task<bool> DisableSchedule(GetScheduleResponse schedule)
        {
            LambdaLogger.Log("DISABLING SCHEDULE:" + JsonConvert.SerializeObject(schedule));

            try
            {
                var updateTerminateScheduleRequest = new UpdateScheduleRequest
                {
                    State = ScheduleState.DISABLED,
                    FlexibleTimeWindow = new FlexibleTimeWindow
                    {
                        Mode = FlexibleTimeWindowMode.OFF,
                    },
                    GroupName = schedule.GroupName,
                    Name = schedule.Name,
                    Target = schedule.Target,
                    ScheduleExpression = schedule.ScheduleExpression,
                };
                LambdaLogger.Log(JsonConvert.SerializeObject(updateTerminateScheduleRequest));
                await _client.UpdateScheduleAsync(updateTerminateScheduleRequest);

            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                return false;
            }
            
            return true;
        }

        public async Task<SchedulerSchedules> GetSchedules()
        {
            var response = new SchedulerSchedules();

            try
            {
                response.ScheduleGroup = await _client.GetScheduleGroupAsync(new GetScheduleGroupRequest
                {
                    Name = ScheduleGroupName
                });

                LambdaLogger.Log(JsonConvert.SerializeObject(response.ScheduleGroup));
            }
            catch (ResourceNotFoundException) // create schedule group if doesn't exist
            {
                try
                {
                    var createGroupResponse = await _client.CreateScheduleGroupAsync(
                        new CreateScheduleGroupRequest
                        {
                            Name = ScheduleGroupName
                        });

                    response.ScheduleGroup = await _client.GetScheduleGroupAsync(new GetScheduleGroupRequest
                    {
                        Name = ScheduleGroupName
                    });
                }
                catch (Exception exception)
                {
                    LambdaLogger.Log(exception.Message);
                    return null;
                }
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
                return null;
            }

            try
            {
                response.LaunchSchedule = await _client.GetScheduleAsync(new GetScheduleRequest
                {
                    Name = LaunchScheduleName,
                    GroupName = ScheduleGroupName,
                });

                LambdaLogger.Log(JsonConvert.SerializeObject(response.LaunchSchedule));
            }
            catch (ResourceNotFoundException)
            {
                try
                {
                    var createLaunchScheduleResponse = await _client.CreateScheduleAsync(
                        new CreateScheduleRequest
                        {
                            Name = LaunchScheduleName,
                            GroupName = ScheduleGroupName,
                            FlexibleTimeWindow = new FlexibleTimeWindow
                            {
                                Mode = FlexibleTimeWindowMode.OFF
                            },
                            Target = new Target
                            {
                                Arn = Environment.GetEnvironmentVariable("VirtualPlayerScheduleActionFunctionArn"),
                                Input = "{}",
                                RoleArn = Environment.GetEnvironmentVariable("VirtualPlayerSchedulerRole"),
                            },
                            State = ScheduleState.DISABLED,
                            ScheduleExpression = "rate(1 minutes)"
                        });

                    response.LaunchSchedule = await _client.GetScheduleAsync(new GetScheduleRequest
                    {
                        Name = LaunchScheduleName,
                        GroupName = ScheduleGroupName,
                    });
                }
                catch (Exception exception)
                {
                    LambdaLogger.Log(exception.Message);
                    return null;
                }
            }

            try
            {
                response.TerminateSchedule = await _client.GetScheduleAsync(new GetScheduleRequest
                {
                    Name = TerminateScheduleName,
                    GroupName = ScheduleGroupName,
                });

                LambdaLogger.Log(JsonConvert.SerializeObject(response.TerminateSchedule));
            }
            catch (ResourceNotFoundException e)
            {
                LambdaLogger.Log(JsonConvert.SerializeObject(e));
                LambdaLogger.Log(e.Message);
                try
                {
                    await _client.CreateScheduleAsync(new CreateScheduleRequest
                    {
                        Name = TerminateScheduleName,
                        GroupName = ScheduleGroupName,
                        FlexibleTimeWindow = new FlexibleTimeWindow
                        {
                            Mode = FlexibleTimeWindowMode.OFF
                        },
                        Target = new Target
                        {
                            Arn = Environment.GetEnvironmentVariable("VirtualPlayerScheduleActionFunctionArn"),
                            Input = "{}",
                            RoleArn = Environment.GetEnvironmentVariable("VirtualPlayerSchedulerRole"),
                        },
                        State = ScheduleState.DISABLED,
                        ScheduleExpression = "rate(1 minutes)"
                    });

                    response.TerminateSchedule = await _client.GetScheduleAsync(new GetScheduleRequest
                    {
                        Name = TerminateScheduleName,
                        GroupName = ScheduleGroupName,
                    });
                }
                catch (Exception exception)
                {
                    LambdaLogger.Log(exception.Message);
                    return null;
                }
            }

            return response;
        }
    }
}