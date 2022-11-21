// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.GameLift.Model;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class ClientMessage
    {
        [JsonProperty(Required = Required.Always)] public string Type;
        [JsonProperty(Required = Required.Default)] public string PlayerId;
        [JsonProperty(Required = Required.Default)] public string Region;
    }
    
    public class ClientMessageRunMatchmakingSimulation : ClientMessage
    {
        public new string Type = "RunMatchmakingSimulation";
        public string RuleSet;
        public MatchmakingSimulationPlayerConfig[] PlayerProfileConfigs;
    }
    
    public class ClientMessageDeletePlayerProfile : ClientMessage
    {
        public new string Type = "DeletePlayerProfile";
        public string ProfileId;
    }
    
    public class ClientMessageSavePlayerProfile : ClientMessage
    {
        public new string Type = "SavePlayerProfile";
        public PlayerProfile Profile;
    }
    
    public class ClientMessageDeleteLatencyProfile : ClientMessage
    {
        public new string Type = "DeleteLatencyProfile";
        public string ProfileId;
    }
    
    public class ClientMessageSaveLatencyProfile : ClientMessage
    {
        public new string Type = "SaveLatencyProfile";
        public LatencyProfile Profile;
    }
    
    public class ClientMessageAdjustFleetCapacity : ClientMessage
    {
        public new string Type = "AdjustFleetCapacity";
        public FleetCapacityAdjustment[] Changes;
    }
    
    public class ClientMessageGetCloudWatchGraph : ClientMessage
    {
        public new string Type = "GetCloudWatchGraph";
        public string MetricWidgetJson;
    }
    
    public class ClientMessageGetGameSessions : ClientMessage
    {
        public new string Type = "GetGameSessions";
        public string FleetId;
    }
    
    public class ClientMessageLaunchPlayers : ClientMessage
    {
        public new string Type = "LaunchPlayers";
        public int NumPlayers;
        public string TaskDefinitionArn;
        public string CapacityProvider;
    }
    
    public class ClientMessageDeleteMatchmakingRuleSet : ClientMessage
    {
        public new string Type = "DeleteMatchmakingRuleSet";
        public string RuleSetName;
    }
    
    public class ClientMessageUpdateMatchmakingConfiguration : ClientMessage
    {
        public new string Type = "UpdateMatchmakingConfiguration";
        public string RuleSetName;
        public string MatchmakingConfigName;
    }
    
    public class ClientMessageCreateMatchmakingRuleSet : ClientMessage
    {
        public new string Type = "CreateMatchmakingRuleSet";
        public string RuleSetName;
        public string RuleSetBody;
    }
    
    public class ClientMessageValidateMatchmakingRuleSet : ClientMessage
    {
        public new string Type = "ValidateMatchmakingRuleSet";
        public string RuleSetBody;
    }
    
    public class ClientMessageGetVirtualPlayers : ClientMessage
    {
        public new string Type = "GetVirtualPlayers";
    }
    
    public class ClientMessageGetPlayerProfiles : ClientMessage
    {
        public new string Type = "GetPlayerProfiles";
    }
    
    public class ClientMessageGetLatencyProfiles : ClientMessage
    {
        public new string Type = "GetLatencyProfiles";
    }
    
    public class ClientMessageGetMatchmakingSimulations : ClientMessage
    {
        public new string Type = "GetMatchmakingSimulations";
    }
    
    public class ClientMessageGetMatchmakingSimulation : ClientMessage
    {
        public new string Type = "GetMatchmakingSimulation";
        public string SimulationId;
    }
    
    public class ClientMessageGetMatchmakingTicketHeaders : ClientMessage
    {
        public new string Type = "GetMatchmakingTicketHeaders";
        public string MatchmakingConfigArn;
    }
    
    public class ClientMessageGetMatchmakingTicketHeadersByMatchId : ClientMessage
    {
        public new string Type = "GetMatchmakingTicketHeadersByMatchId";
        public string MatchId;
    }
    
    public class ClientMessageGetMatchmakingTicketHeadersBySimulationId : ClientMessage
    {
        public new string Type = "GetMatchmakingTicketHeadersBySimulationId";
        public string SimulationId;
    }
    
    public class ClientMessageGetSimulationMatches : ClientMessage
    {
        public new string Type = "GetSimulationMatches";
        public string SimulationId;
    }
    
    public class ClientMessageGetMatchmakingTicket : ClientMessage
    {
        public new string Type = "GetMatchmakingTicket";
        public string TicketId;
    }
    
    public class ClientMessageSimulateMatchmaking : ClientMessage
    {
        public new string Type = "SimulateMatchmaking";
    }
    
    public class ClientMessageSetScalingPolicy : ClientMessage
    {
        public new string Type = "SetScalingPolicy";
        public string FleetId;
        public string Name;
        public string PolicyType;
        public string MetricName;
        public TargetConfiguration TargetConfiguration;
        public double Threshold;
    }
    
    public class ClientMessageDeleteScalingPolicy : ClientMessage
    {
        public new string Type = "DeleteScalingPolicy";
        public string FleetId;
        public string Name;
    }
    
    public class ClientMessageTerminateVirtualPlayer : ClientMessage
    {
        public new string Type = "TerminateVirtualPlayer";
        public string TaskArn;
    }
    
    public class ClientMessageGetQueueEvents : ClientMessage
    {
        public new string Type = "GetQueueEvents";
        public string QueueArn;
    }
    
    public class ClientMessageGetQueueEventByPlacementId : ClientMessage
    {
        public new string Type = "GetQueueEventByPlacementId";
        public string PlacementId;
    }
    
    public class ClientMessageGetPlayerSessions : ClientMessage
    {
        public new string Type = "GetPlayerSessions";
        public string GameSessionId;
    }
    
    public class ClientMessageGetGameSessionQueue : ClientMessage
    {
        public new string Type = "GetGameSessionQueue";
        public string QueueArn;
    }
    
    public class ClientMessageGetGameSessionQueueDestinationInfo : ClientMessage
    {
        public new string Type = "GetGameSessionQueueDestinationInfo";
        public string QueueArn;
    }
    
    public class ClientMessageGetFleetScaling : ClientMessage
    {
        public new string Type = "GetFleetScaling";
        public string FleetId;
    }
    
    public class ClientMessageGetCloudWatchLogs : ClientMessage
    {
        public new string Type = "GetCloudWatchLogs";
        public string LogGroup;
        public string LogStream;
    }
    
    public class ClientMessageGetGameSessionLogs : ClientMessage
    {
        public new string Type = "GetGameSessionLogs";
        public string GameSessionId;
    }
    
    public class ClientMessageUpdateFleetLocations : ClientMessage
    {
        public new string Type = "UpdateFleetLocations";
        public string FleetId;
        public string[] AddedLocations;
        public string[] RemovedLocations;
    }
    
    public class ClientMessageUpdateQueueSettings : ClientMessage
    {
        public new string Type = "UpdateQueueSettings";
        public string QueueArn;
        public int TimeoutInSeconds;
        public PlayerLatencyPolicy[] PlayerLatencyPolicies;
    }

    public class ClientMessageUpdateQueuePriorityConfiguration : ClientMessage
    {
        public new string Type = "UpdateQueuePriorityConfiguration";
        public string QueueArn;
        public string[] LocationOrder;
        public string[] PriorityOrder;
    }

    public class ClientMessageUpdateQueueDestinations : ClientMessage
    {
        public new string Type = "UpdateQueueDestinations";
        public string QueueArn;
        public string[] Destinations;
    }    
    
    public class ClientMessageUpdateQueueAllowedLocations : ClientMessage
    {
        public new string Type = "UpdateQueueAllowedLocations";
        public string QueueArn;
        public string[] AllowedLocations;
    }   
    
    public class FleetCapacityAdjustment
    {
        public string FleetId;
        public string Location;
        public int Min;
        public int Desired;
        public int Max;
    }
}