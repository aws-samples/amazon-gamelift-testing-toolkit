// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using Amazon.GameLift.Model;
using KellermanSoftware.CompareNetObjects;
using ManagementConsoleBackend.Common;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class GameLiftStateEvent : BaseEvent
    {
        [JsonProperty("detail")]
        public GameLiftStateEventDetail Detail { get; set; }
    }
    
    public class GameLiftStateDatabaseItem
    {
        public DateTime Date { get; set; }
        
        public DateTime Time { get; set; }

        public GameLiftStateEventDetail State;
        
        public List<Difference> Differences;

        public long TimeToLive;
    }
    
    public class GameLiftStateEventDetail
    {
        public List<FleetData> FleetData = new List<FleetData>();
        public List<MatchmakingConfiguration> MatchmakingConfigurations = new List<MatchmakingConfiguration>();
        public MatchmakingConfiguration MatchmakingSimulator = new MatchmakingConfiguration();
        public List<GameSessionQueue> GameSessionQueues = new List<GameSessionQueue>();
        public List<Alias> Aliases = new List<Alias>();
    }

    public class FleetData
    {
        public string FleetId;
        public FleetCapacity FleetCapacity;
        public FleetUtilization FleetUtilization;
        public FleetAttributes FleetAttributes;
        public List<LocationAttributes> LocationAttributes;
        public List<FleetCapacity> LocationCapacities;
        public List<ScalingPolicy> ScalingPolicies = new List<ScalingPolicy>();
        public RuntimeConfiguration RuntimeConfiguration;
        public List<Event> FleetEvents = new List<Event>();
        public List<GameSession> GameSessions = new List<GameSession>();
        public List<Instance> Instances = new List<Instance>();
        public Dictionary<string, double> Metrics = new Dictionary<string, double>();
    }
}