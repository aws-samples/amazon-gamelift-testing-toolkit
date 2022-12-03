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
    }
    
    public class VirtualPlayerTaskQuotas
    {
        public double RatePerMinute;
        public double RunningFargateOnDemandVcpu;
        public double RunningFargateSpotVcpu;
        
    }
    
    public class LaunchTaskRequest
    {
        [DynamoDBHashKey]
        public string LaunchId;

        [DynamoDBProperty("ScheduleId")]
        public string ScheduleId;
        
        [DynamoDBProperty("Time")]
        public string Time;

        [DynamoDBProperty("TaskDefinitionArn")]
        public string TaskDefinitionArn;

        [DynamoDBProperty("Tasks")]
        public List<VirtualPlayerTask> Tasks;

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
}