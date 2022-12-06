// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Data
{

    public class VirtualPlayerTaskSchedule
    {
        public string ScheduleId;
        public string ScheduleName;
        public int LaunchTime;
        public int TerminationTime;
        public int NumTasks;
        public double PercentageIncrease;
        public int SchedulePeriodMinutes;
        public List<VirtualPlayerTaskScheduleAction> Actions;
    }

    public class VirtualPlayerTaskScheduleAction
    {
        public string Type;
        public int Minutes;
        public int NumTasks;
        public string Status;
        public string ScheduledTime;
        public string ExecutedTime;
        public string LaunchId;
    }
    
    public class VirtualPlayerTaskQuotas
    {
        public double RatePerMinute;
        public double RunningFargateOnDemandVcpu;
        public double RunningFargateSpotVcpu;
        
    }
    
    public class VirtualPlayerLaunchRequest
    {
        [DynamoDBHashKey]
        public string LaunchId;

        [DynamoDBProperty("ScheduleId")]
        public string ScheduleId;
        
        [DynamoDBProperty("Type")]
        public string Type;

        [DynamoDBProperty("Time")]
        public string Time;

        [DynamoDBProperty("TaskDefinitionArn")]
        public string TaskDefinitionArn;

        [DynamoDBProperty("Tasks")]
        public List<VirtualPlayerTask> Tasks;

        [DynamoDBProperty("Schedule")]
        public VirtualPlayerTaskSchedule Schedule;
        
        [DynamoDBProperty("ScheduleName")]
        public string ScheduleName;
        
        [DynamoDBProperty("CapacityProvider")]
        public string CapacityProvider;
    }

    public class VirtualPlayerTask
    {
        public string TaskArn;
        public string CreatedAt;
        public string CapacityProviderName;
        public string Cpu;
        public string Memory;
        public string ContainerArn;
        public string LogGroup;
        public string LogStream;
        public string LastStatus;
    }

    public class VirtualPlayerScheduleTargetInput
    {
        public string LaunchId;
        public string Type;
    }
}