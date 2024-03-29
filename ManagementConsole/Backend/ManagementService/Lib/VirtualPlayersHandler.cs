// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Lambda.Core;
using Amazon.Runtime.Internal;
using Amazon.Scheduler;
using Amazon.Scheduler.Model;
using Amazon.ServiceQuotas;
using Amazon.ServiceQuotas.Model;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using Newtonsoft.Json;
using AssignPublicIp = Amazon.ECS.AssignPublicIp;
using CapacityProviderStrategyItem = Amazon.ECS.Model.CapacityProviderStrategyItem;
using ListTagsForResourceRequest = Amazon.ECS.Model.ListTagsForResourceRequest;
using ResourceNotFoundException = Amazon.Scheduler.Model.ResourceNotFoundException;
using Tag = Amazon.ECS.Model.Tag;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public class VirtualPlayersHandler
    {
        private AmazonECSClient _client;

        public VirtualPlayersHandler(AmazonECSClient client)
        {
            _client = client;
        }

        public async Task<ServerMessageLaunchSchedule> LaunchSchedule(ClientMessageLaunchVirtualPlayerTaskSchedule scheduleRequest)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);

            var response = new ServerMessageLaunchSchedule();
            var schedulerHandler = new SchedulerHandler(new AmazonSchedulerClient());
            var initialisedSchedules = await schedulerHandler.GetSchedules();
            if (initialisedSchedules == null)
            {
                response.Result = false;
                response.Errors = new List<string>
                {
                    "Couldn't initialise scheduler"
                };
                return response;
            }

            if (initialisedSchedules.LaunchSchedule.State.Value != "DISABLED" || initialisedSchedules.TerminateSchedule.State.Value != "DISABLED")
            {
                LambdaLogger.Log("ONE OR MORE SCHEDULES IS NOT DISABLED!  EXITING");
                response.Result = false;
                response.Errors = new List<string>
                {
                    "Schedule still active"
                };
                return response;
            }
            
            LambdaLogger.Log("INITIALISED SCHEDULES:" + JsonConvert.SerializeObject(initialisedSchedules));

            LambdaLogger.Log("SETTING UP: " + JsonConvert.SerializeObject(scheduleRequest));

            var schedule = await dynamoDbRequestHandler.GetVirtualPlayerTaskSchedule(scheduleRequest.ScheduleId);
            LambdaLogger.Log(JsonConvert.SerializeObject(schedule));
            
            if (schedule == null)
            {
                response.Result = false;
                response.Errors = new List<string>
                {
                    "Schedule not found"
                };
                return response;
            }
            
            var scheduleLaunchRequest = new VirtualPlayerLaunchRequest
            {
                LaunchId = Guid.NewGuid().ToString(),
                Type = "ScheduleLaunch",
                TaskDefinitionArn = scheduleRequest.TaskDefinitionArn,
                Time = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Tasks = new List<VirtualPlayerTask>(),
                ScheduleId = scheduleRequest.ScheduleId,
                Schedule = schedule,
                ScheduleName = schedule.ScheduleName,
                CapacityProvider = scheduleRequest.CapacityProvider,
            };
            
            var scheduleTimes = await schedulerHandler.UpdateSchedules(initialisedSchedules, scheduleLaunchRequest);

            if (scheduleTimes != null)
            {
                for (var i = 0; i < schedule.Actions.Count; i++)
                {
                    if (schedule.Actions[i].Type == "Launch")
                    {
                        schedule.Actions[i].ScheduledTime = scheduleTimes.LaunchScheduleStart.AddMinutes(schedule.Actions[i].Minutes - schedule.SchedulePeriodMinutes).ToString("yyyy-MM-ddTHH:mm:ss");
                    }
                    else
                    if (schedule.Actions[i].Type == "Terminate")
                    {
                        schedule.Actions[i].ScheduledTime = scheduleTimes.TerminateScheduleStart.ToString("yyyy-MM-ddTHH:mm:ss");
                    }
                }
                LambdaLogger.Log(JsonConvert.SerializeObject(scheduleLaunchRequest));
                var saved = await dynamoDbRequestHandler.SaveLaunchRequest(scheduleLaunchRequest);
                if (!saved)
                {
                    LambdaLogger.Log("Couldn't save launch request");
                    return response;
                }
            }
            
            response.Result = true;
            return response;
        }

        // Launches a number of virtual players via Fargate
        public async Task<VirtualPlayerLaunchRequest> LaunchPlayers(int numPlayers, string taskDefinitionArn, string capacityProvider, string connectionId=null, string stageServiceUrl=null, VirtualPlayerLaunchRequest scheduleLaunchRequest=null)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            var maxTasksPerRequest = 10;
            var remainingPlayersToLaunch = numPlayers;
            var playersToLaunch = remainingPlayersToLaunch;
            var scheduleName = "-";
            var scheduleId = "-";
            if (scheduleLaunchRequest != null)
            {
                scheduleId = scheduleLaunchRequest.Schedule.ScheduleId;
                scheduleName = scheduleLaunchRequest.Schedule.ScheduleName;
            }
            var launchTaskRequest = new VirtualPlayerLaunchRequest
            {
                LaunchId = Guid.NewGuid().ToString(),
                Type = "TaskLaunch",
                TaskDefinitionArn = taskDefinitionArn,
                Time = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Tasks = new List<VirtualPlayerTask>(),
                ScheduleId = scheduleId,
                ScheduleName = scheduleName,
                CapacityProvider = capacityProvider,
            };

            var responses = new List<RunTaskResponse>();
            var taskDefinitions = await GetTaskDefinitions();
            try
            {
                do
                {
                    playersToLaunch = remainingPlayersToLaunch;
                    
                    if (playersToLaunch > maxTasksPerRequest)
                    {
                        playersToLaunch = maxTasksPerRequest;
                    }

                    // Launch players with the VirtualPlayers tag set to true
                    var tags = new List<Tag>();
                    tags.Add(new Tag
                    {
                        Key = "AmazonGameLiftTestingToolkit-VirtualPlayers",
                        Value = "true",
                    });

                    if (scheduleLaunchRequest != null)
                    {
                        tags.Add(new Tag
                        {
                            Key = "ScheduleLaunchId",
                            Value = scheduleLaunchRequest.LaunchId,
                        });
                    }

                    var strategies = new List<CapacityProviderStrategyItem>();
                    strategies.Add(new CapacityProviderStrategyItem
                    {
                        CapacityProvider = capacityProvider,
                        Weight = 1,
                    });

                    var request = new RunTaskRequest
                    {
                        Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                        TaskDefinition = taskDefinitionArn,
                        CapacityProviderStrategy = strategies,
                        Count = playersToLaunch,
                        NetworkConfiguration = new Amazon.ECS.Model.NetworkConfiguration
                        {
                            AwsvpcConfiguration = new Amazon.ECS.Model.AwsVpcConfiguration
                            {
                                AssignPublicIp = AssignPublicIp.DISABLED,
                                Subnets = JsonConvert.DeserializeObject<List<string>>(
                                    Environment.GetEnvironmentVariable("VirtualPlayersSubnetIds")),
                                SecurityGroups = new [] { Environment.GetEnvironmentVariable("VirtualPlayersSecurityGroupId") }.ToList()
                            }
                        },
                        Tags = tags, 
                    };
                    
                    LambdaLogger.Log(JsonConvert.SerializeObject(request));
                    var response = await _client.RunTaskAsync(request);
                    LambdaLogger.Log(JsonConvert.SerializeObject(response));
                    LambdaLogger.Log("HOPED TO LAUNCH " + playersToLaunch + " - RESPONSE CONTAINED " + response.Tasks.Count + " TASKS");
                    
                    remainingPlayersToLaunch -= response.Tasks.Count;

                    foreach (var task in response.Tasks)
                    {
                        var virtualPlayerTask = new VirtualPlayerTask
                        {
                            CreatedAt = task.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                            CapacityProviderName = task.CapacityProviderName,
                            Cpu = task.Cpu,
                            Memory = task.Memory,
                            TaskArn = task.TaskArn,
                            LastStatus = task.LastStatus,
                        };

                        var taskDef = taskDefinitions.Find(x => x.TaskDefinitionArn == task.TaskDefinitionArn);

                        if (taskDef!=null && taskDef.ContainerDefinitions.Count > 0)
                        {
                            var logOptions = taskDef.ContainerDefinitions[0].LogConfiguration.Options;
                            if (logOptions["awslogs-group"] != null)
                            {
                                var taskId = virtualPlayerTask.TaskArn.Split("/").Last();
                                virtualPlayerTask.LogGroup = logOptions["awslogs-group"];
                                virtualPlayerTask.LogStream = logOptions["awslogs-stream-prefix"] + "/" + taskDef.ContainerDefinitions[0].Name + "/" + taskId;
                            }
                        }
                        
                        if (task.Containers.Count > 0)
                        {
                            virtualPlayerTask.ContainerArn = task.Containers[0].ContainerArn;
                        }
                        
                        launchTaskRequest.Tasks.Add(virtualPlayerTask);
                    }

                    if (connectionId != null && stageServiceUrl != null)
                    {
                        await Utils.SendJsonResponse(connectionId, stageServiceUrl, new ServerMessageLaunchVirtualPlayerTasksProgress
                        {
                            NumLaunched = numPlayers - remainingPlayersToLaunch,
                            TotalToLaunch = numPlayers,
                        });
                    }

                } while (remainingPlayersToLaunch > 0);

                await dynamoDbRequestHandler.SaveLaunchRequest(launchTaskRequest);
                return launchTaskRequest;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<Amazon.ECS.Model.TaskDefinition>> GetTaskDefinitions()
        {
            var taskDefinitions = new List<TaskDefinition>();
            
            try
            {
                var listTaskDefinitionsPaginator =  _client.Paginators.ListTaskDefinitions(new ListTaskDefinitionsRequest());
                
                await foreach (var taskDefinitionArn in listTaskDefinitionsPaginator.TaskDefinitionArns)
                {
                    var listTagsForResourceResponse = await _client.ListTagsForResourceAsync(new ListTagsForResourceRequest
                    {
                        ResourceArn = taskDefinitionArn
                    });

                    if (!listTagsForResourceResponse.Tags.Exists(t => t.Key == "AmazonGameLiftTestingToolkit-VirtualPlayers" && t.Value == "true"))
                    {
                        // Skip task definitions missing a VirtualPlayers=true tag
                        LambdaLogger.Log("Skipping " + taskDefinitionArn + " as Virtual Players tag doesn't exist");
                        continue;
                    }
                    
                    var describeTaskDefinitionsResponse = await _client.DescribeTaskDefinitionAsync(
                        new DescribeTaskDefinitionRequest
                        {
                            TaskDefinition = taskDefinitionArn
                        });
                    
                    taskDefinitions.Add(describeTaskDefinitionsResponse.TaskDefinition);
                }
                
                return taskDefinitions;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<VirtualPlayerTask>> GetVirtualPlayerTasks()
        {
            var taskArns = new List<string>();
            var tasks = new List<VirtualPlayerTask>();
            var taskDefinitions = await GetTaskDefinitions();
            try
            {
                var request = new ListTasksRequest()
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                };
                
                LambdaLogger.Log(JsonConvert.SerializeObject(request));
                
                var listTasksPaginator = _client.Paginators.ListTasks(request);
                
                await foreach (var taskArn in listTasksPaginator.TaskArns)
                {
                    taskArns.Add(taskArn);
                }
                
                var maxTasksPerRequest = 100;

                for (var i = 0; i < taskArns.Count; i += maxTasksPerRequest)
                {
                    List<string> items = taskArns.GetRange(i, Math.Min(maxTasksPerRequest, taskArns.Count - i));
                    var describeTasksResponse = await _client.DescribeTasksAsync(
                        new DescribeTasksRequest
                        {
                            Tasks = items,
                            Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn")
                        });

                    foreach (var task in describeTasksResponse.Tasks)
                    {
                        var virtualPlayerTask = new VirtualPlayerTask
                        {
                            CreatedAt = task.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                            CapacityProviderName = task.CapacityProviderName,
                            Cpu = task.Cpu,
                            Memory = task.Memory,
                            TaskArn = task.TaskArn,
                            LastStatus = task.LastStatus,
                        };

                        var taskDef = taskDefinitions.Find(x => x.TaskDefinitionArn == task.TaskDefinitionArn);

                        if (taskDef!=null && taskDef.ContainerDefinitions.Count > 0)
                        {
                            var logOptions = taskDef.ContainerDefinitions[0].LogConfiguration.Options;
                            if (logOptions["awslogs-group"] != null)
                            {
                                var taskId = virtualPlayerTask.TaskArn.Split("/").Last();
                                virtualPlayerTask.LogGroup = logOptions["awslogs-group"];
                                virtualPlayerTask.LogStream = logOptions["awslogs-stream-prefix"] + "/" + taskDef.ContainerDefinitions[0].Name + "/" + taskId;
                            }
                        }
                        
                        if (task.Containers.Count > 0)
                        {
                            virtualPlayerTask.ContainerArn = task.Containers[0].ContainerArn;
                        }
                        
                        tasks.Add(virtualPlayerTask);
                    }
                }

                return tasks;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<VirtualPlayerTaskQuotas> GetVirtualPlayerTaskQuotas()
        {
            var quotasClient = new AmazonServiceQuotasClient();
            var quotaResult = new VirtualPlayerTaskQuotas();

            try
            {
                var getDefaultQuotaResponse = await quotasClient.GetAWSDefaultServiceQuotaAsync(new GetAWSDefaultServiceQuotaRequest
                {
                    ServiceCode = "ecs",
                    QuotaCode = "L-D3FB61D9",
                });

                quotaResult.RatePerMinute = getDefaultQuotaResponse.Quota.Value;

                var getOnDemandQuotaResponse = await quotasClient.GetServiceQuotaAsync(new GetServiceQuotaRequest
                {
                    ServiceCode = "fargate",
                    QuotaCode = "L-3032A538",
                });

                quotaResult.RunningFargateOnDemandVcpu = getOnDemandQuotaResponse.Quota.Value;

                var getSpotQuotaResponse = await quotasClient.GetServiceQuotaAsync(new GetServiceQuotaRequest
                {
                    ServiceCode = "fargate",
                    QuotaCode = "L-36FBB829",
                });

                quotaResult.RunningFargateSpotVcpu = getSpotQuotaResponse.Quota.Value;
                
                return quotaResult;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<VirtualPlayerTask>> GetVirtualPlayerTaskHistory()
        {
            var taskArns = new List<string>();
            var tasks = new List<VirtualPlayerTask>();
            var taskDefinitions = await GetTaskDefinitions();
            try
            {
                var request = new ListTasksRequest()
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                };
                
                LambdaLogger.Log(JsonConvert.SerializeObject(request));
                
                var listTasksPaginator = _client.Paginators.ListTasks(request);
                
                await foreach (var taskArn in listTasksPaginator.TaskArns)
                {
                    taskArns.Add(taskArn);
                }
                
                var maxTasksPerRequest = 100;

                for (var i = 0; i < taskArns.Count; i += maxTasksPerRequest)
                {
                    List<string> items = taskArns.GetRange(i, Math.Min(maxTasksPerRequest, taskArns.Count - i));
                    var describeTasksResponse = await _client.DescribeTasksAsync(
                        new DescribeTasksRequest
                        {
                            Tasks = items,
                            Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn")
                        });

                    foreach (var task in describeTasksResponse.Tasks)
                    {
                        var virtualPlayerTask = new VirtualPlayerTask
                        {
                            CreatedAt = task.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                            CapacityProviderName = task.CapacityProviderName,
                            Cpu = task.Cpu,
                            Memory = task.Memory,
                            TaskArn = task.TaskArn,
                            LastStatus = task.LastStatus,
                        };

                        var taskDef = taskDefinitions.Find(x => x.TaskDefinitionArn == task.TaskDefinitionArn);

                        if (taskDef!=null && taskDef.ContainerDefinitions.Count > 0)
                        {
                            var logOptions = taskDef.ContainerDefinitions[0].LogConfiguration.Options;
                            if (logOptions["awslogs-group"] != null)
                            {
                                var taskId = virtualPlayerTask.TaskArn.Split("/").Last();
                                virtualPlayerTask.LogGroup = logOptions["awslogs-group"];
                                virtualPlayerTask.LogStream = logOptions["awslogs-stream-prefix"] + "/" + taskDef.ContainerDefinitions[0].Name + "/" + taskId;
                            }
                        }
                        
                        if (task.Containers.Count > 0)
                        {
                            virtualPlayerTask.ContainerArn = task.Containers[0].ContainerArn;
                        }
                        
                        tasks.Add(virtualPlayerTask);
                    }
                }

                return tasks;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<ServerMessageTerminateSchedule> TerminateSchedule(string LaunchId)
        {
            var errors = new List<string>();
            var response = new ServerMessageTerminateSchedule();
            response.Result = false;
            
            var schedulerHandler = new SchedulerHandler(new AmazonSchedulerClient());
            var initialisedSchedules = await schedulerHandler.GetSchedules();
            if (initialisedSchedules == null)
            {
                response.Result = false;
                response.Errors = new List<string>
                {
                    "Couldn't initialise scheduler"
                };
                return response;
            }

            if (initialisedSchedules.LaunchSchedule.State.Value != "DISABLED")
            {
                var inputObj = JsonConvert.DeserializeObject<VirtualPlayerScheduleTargetInput>(initialisedSchedules.LaunchSchedule.Target.Input);
                if (inputObj != null && inputObj.LaunchId == LaunchId)
                {
                    await schedulerHandler.DisableSchedule(initialisedSchedules.LaunchSchedule);
                }
            }
            
            // sleep for 10 seconds in case any tasks are launching
            System.Threading.Thread.Sleep(10000);
            
            // terminate tasks
            var terminateErrors = await TerminateVirtualPlayerTasksByLaunchIdTag(LaunchId);
            if (terminateErrors.Count > 0)
            {
                response.Result = false;
                response.Errors.AddRange(terminateErrors);
                return response;
            }
            
            if (initialisedSchedules.TerminateSchedule.State.Value != "DISABLED")
            {
                var inputObj = JsonConvert.DeserializeObject<VirtualPlayerScheduleTargetInput>(initialisedSchedules.LaunchSchedule.Target.Input);
                if (inputObj != null && inputObj.LaunchId == LaunchId)
                {
                    await schedulerHandler.DisableSchedule(initialisedSchedules.TerminateSchedule);
                }
            }

            response.Result = true;
            return response;
        }
        
        public async Task<List<string>> TerminateVirtualPlayerTasksByLaunchIdTag(string LaunchId)
        {
            var errors = new List<string>();
            try
            {
                var request = new ListTasksRequest()
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                };
                
                var listTasksPaginator = _client.Paginators.ListTasks(request);
                
                await foreach (var taskArn in listTasksPaginator.TaskArns)
                {
                    try
                    {
                        var listTagsForResourceResponse = await _client.ListTagsForResourceAsync(new ListTagsForResourceRequest
                        {
                            ResourceArn = taskArn
                        });
                        
                        LambdaLogger.Log("CHECKING TAGS FOR " +taskArn + ":" + JsonConvert.SerializeObject(listTagsForResourceResponse));
                        
                        if (listTagsForResourceResponse.Tags.Exists(t => t.Key == "ScheduleLaunchId" && t.Value == LaunchId))
                        {
                            // Skip task definitions missing a VirtualPlayers=true tag
                            errors.AddRange(await TerminateVirtualPlayerTask(taskArn));
                        }
                    }
                    catch (Exception e)
                    {
                        errors.Add(e.Message);
                    }
                }
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }

        public async Task<List<string>> TerminateAllVirtualPlayerTasks()
        {
            var errors = new List<string>();
            try
            {
                var request = new ListTasksRequest()
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                };
                
                var listTasksPaginator = _client.Paginators.ListTasks(request);
                
                await foreach (var taskArn in listTasksPaginator.TaskArns)
                {
                    try
                    {
                        errors.AddRange(await TerminateVirtualPlayerTask(taskArn));
                    }
                    catch (Exception e)
                    {
                        errors.Add(e.Message);
                    }
                }
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }
        
        public async Task<List<string>> TerminateVirtualPlayerTask(string TaskArn)
        {
            var errors = new List<string>();
            try
            {
                var result = await _client.StopTaskAsync(new StopTaskRequest
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                    Task = TaskArn
                });
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }

    }
}