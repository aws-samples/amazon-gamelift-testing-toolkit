// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.CloudWatchLogs.Model;
using Amazon.ECS.Model;
using Amazon.GameLift.Model;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class ServerMessage
    {
        [JsonProperty("Type")]
        public string Type { get; set; }
    }

    public class ServerMessageSavePlayerProfile : ServerMessage
    {
        public new string Type = "SavePlayerProfile";
        public List<string> Errors;
    }
    
    public class ServerMessageDeletePlayerProfile : ServerMessage
    {
        public new string Type = "DeletePlayerProfile";
        public List<string> Errors;
    }
    
    public class ServerMessageSaveLatencyProfile : ServerMessage
    {
        public new string Type = "SaveLatencyProfile";
        public List<string> Errors;
    }
    
    public class ServerMessageDeleteLatencyProfile : ServerMessage
    {
        public new string Type = "DeleteLatencyProfile";
        public List<string> Errors;
    }
    
    public class ServerMessageGetFleetAttributes : ServerMessage
    {
        public new string Type = "GetFleetAttributes";
        public List<FleetAttributes> FleetAttributes;
    }
    
    public class ServerMessageGetAliases : ServerMessage
    {
        public new string Type = "GetAliases";
        public List<Alias> Aliases;
    }
    
    public class ServerMessageGetFleetScaling : ServerMessage
    {
        public new string Type = "GetFleetScaling";
        public List<FleetCapacity> FleetCapacities;
        public List<ScalingPolicy> ScalingPolicies;
    }
    
    public class ServerMessageGetCloudWatchLogs : ServerMessage
    {
        public new string Type = "GetCloudWatchLogs";
        public List<OutputLogEvent> LogEvents;
        public string ErrorMessage = null;
    }
    
    public class ServerMessageGetGameSessions : ServerMessage
    {
        public new string Type = "GetGameSessions";
        public List<GameSession> GameSessions;
    }
    
    public class ServerMessageGetGameSessionQueue : ServerMessage
    {
        public new string Type = "GetGameSessionQueue";
        public GameSessionQueue GameSessionQueue;
    }
    
    public class ServerMessageGetGameSessionQueueDestinationInfo : ServerMessage
    {
        public new string Type = "GetGameSessionQueueDestinationInfo";
        public GameSessionQueue GameSessionQueue;
        public List<FleetAttributes> FleetAttributes;
        public List<Alias> Aliases;
    }
    
    public class ServerMessageGetVirtualPlayerTasks : ServerMessage
    {
        public new string Type = "GetVirtualPlayerTasks";
        public List<VirtualPlayerTask> Tasks;
    }
    
    public class ServerMessageGetVirtualPlayerTaskQuotas : ServerMessage
    {
        public new string Type = "GetVirtualPlayerTaskQuotas";
        public VirtualPlayerTaskQuotas Quotas;
    }
    
    public class ServerMessageCreateVirtualPlayerTaskSchedule : ServerMessage
    {
        public new string Type = "CreateVirtualPlayerTaskSchedule";
        public VirtualPlayerTaskSchedule Schedule;
        public bool Created;
        public string ErrorMessage = "";
    }
    
    public class ServerMessageGetVirtualPlayerTaskSchedules : ServerMessage
    {
        public new string Type = "GetVirtualPlayerTaskSchedules";
        public List<VirtualPlayerTaskSchedule> Schedules;
    }
    
    public class ServerMessageGetVirtualPlayerTaskSchedule : ServerMessage
    {
        public new string Type = "GetVirtualPlayerTaskSchedule";
        public VirtualPlayerTaskSchedule Schedule;
    }
    
    public class ServerMessageGetSchedulerSchedules : ServerMessage
    {
        public new string Type = "GetSchedulerSchedules";
        public SchedulerSchedules Schedules;
    }
    
    public class ServerMessageGetLaunchRequest : ServerMessage
    {
        public new string Type = "GetLaunchRequest";
        public VirtualPlayerLaunchRequest LaunchRequest;
    }
    
    public class ServerMessageGetVirtualPlayerLaunchTaskRequests : ServerMessage
    {
        public new string Type = "GetVirtualPlayerLaunchTaskRequests";
        public List<VirtualPlayerLaunchRequest> LaunchTaskRequests;
    }
    
    public class ServerMessageGetQueueEvents : ServerMessage
    {
        public new string Type = "GetQueueEvents";
        public List<QueuePlacementEvent> Events;
    }
    
    public class ServerMessageGetQueueEventByPlacementId : ServerMessage
    {
        public new string Type = "GetQueueEventByPlacementId";
        public QueuePlacementEvent Event;
    }
    
    public class ServerMessageGetTaskDefinitions : ServerMessage
    {
        public new string Type = "GetTaskDefinitions";
        public List<TaskDefinition> TaskDefinitions;
    }
    
    public class ServerMessageGetGameSessionLogs : ServerMessage
    {
        public new string Type = "GetGameSessionLogs";
        public List<string> LogEvents;
        public Dictionary<string, List<string>> LogFiles;
        public string ErrorMessage = null;
    }

    public class ServerMessageGetPlayerSessions : ServerMessage
    {
        public new string Type = "GetPlayerSessions";
        public List<PlayerSession> PlayerSessions;
    }

    
    public class ServerMessageGetState : ServerMessage
    {
        public new string Type = "GetState";
        public GameLiftStateEventDetail State;
        public bool IsDb = false;
    }
    
    public class ServerMessageTerminateVirtualPlayerTasks : ServerMessage
    {
        public new string Type = "TerminateVirtualPlayerTasks";
        public List<string> Errors;
    }

    public class ServerMessageSetScalingPolicy : ServerMessage
    {
        public new string Type = "SetScalingPolicy";
        public List<string> Errors;
    }
    
    public class ServerMessageGetSimulationMatches : ServerMessage
    {
        public new string Type = "GetSimulationMatches";
        public List<MatchResultData> MatchResults;
    }
    
    public class ServerMessageGetMatchmakingTicketHeaders : ServerMessage
    {
        public new string Type = "GetMatchmakingTicketHeaders";
        public List<TicketTableDocument> TicketHeaders;
    }
    
    public class ServerMessageGetMatchmakingTicketHeadersByMatchId : ServerMessage
    {
        public new string Type = "GetMatchmakingTicketHeadersByMatchId";
        public List<TicketTableDocument> TicketHeaders;
    }
    
    public class ServerMessageGetMatchmakingTicketHeadersBySimulationId : ServerMessage
    {
        public new string Type = "GetMatchmakingTicketHeadersBySimulationId";
        public List<TicketTableDocument> TicketHeaders;
    }
    
    public class ServerMessageRunMatchmakingSimulation : ServerMessage
    {
        public new string Type = "RunMatchmakingSimulation";
        public MatchmakingSimulation Simulation;
        public List<string> Errors;
    }

    public class ServerMessageGetMatchmakingSimulations : ServerMessage
    {
        public new string Type = "GetMatchmakingSimulations";
        public List<MatchmakingSimulation> Simulations;
    }
    
    public class ServerMessageGetMatchmakingSimulation : ServerMessage
    {
        public new string Type = "GetMatchmakingSimulation";
        public MatchmakingSimulation Simulation;
    }
    
    public class ServerMessageGetPlayerProfiles : ServerMessage
    {
        public new string Type = "GetPlayerProfiles";
        public List<PlayerProfile> Profiles;
    }
    
    public class ServerMessageGetLatencyProfiles : ServerMessage
    {
        public new string Type = "GetLatencyProfiles";
        public List<LatencyProfile> Profiles;
    }
    
    public class ServerMessageGetMatchmakingTicket : ServerMessage
    {
        public new string Type = "GetMatchmakingTicket";
        public FlexMatchTicket Ticket;
        public List<QueuePlacementEvent> QueuePlacementEvents;
    }
    
    public class ServerMessageGetCloudWatchGraph : ServerMessage
    {
        public new string Type = "GetCloudWatchGraph";
        public string Image;
    }
    
    public class ServerMessageGetMatchmakingRuleSets : ServerMessage
    {
        public new string Type = "GetMatchmakingRuleSets";
        public List<MatchmakingRuleSet> RuleSets;
    }
    
    public class ServerMessageUpdateMatchmakingConfiguration : ServerMessage
    {
        public new string Type = "UpdateMatchmakingConfiguration";
        public MatchmakingConfiguration Configuration;
        public string ErrorMessage = "";
        public bool Updated = false;
    }
    
    public class ServerMessageUpdateGameSessionQueue : ServerMessage
    {
        public new string Type = "UpdateGameSessionQueue";
        public GameSessionQueue UpdatedQueue;
        public string ErrorMessage = "";
        public bool Updated = false;
    }
    
    public class ServerMessageValidateMatchmakingRuleSet : ServerMessage
    {
        public new string Type = "ValidateMatchmakingRuleSet";
        public string ErrorMessage = "";
        public bool Validated;
    }
    
    public class ServerMessageCreateMatchmakingRuleSet : ServerMessage
    {
        public new string Type = "CreateMatchmakingRuleSet";
        public bool Created;
        public MatchmakingRuleSet RuleSet;
        public string ErrorMessage = "";
    }
    
    public class ServerMessageDeleteMatchmakingRuleSet : ServerMessage
    {
        public new string Type = "DeleteMatchmakingRuleSet";
        public bool Deleted;
        public string ErrorMessage = "";
    }
    
    public class ServerMessageDeleteVirtualPlayerTaskSchedule : ServerMessage
    {
        public new string Type = "DeleteVirtualPlayerTaskSchedule";
        public List<string> Errors;
    }

    public class ServerMessageDeleteScalingPolicy : ServerMessage
    {
        public new string Type = "DeleteScalingPolicy";
        public List<string> Errors;
    }
    
    public class ServerMessageAdjustFleetCapacityResult : ServerMessage
    {
        public new string Type = "AdjustFleetCapacity";
        public List<string> Errors;
    }
    
    public class ServerMessageUpdateFleetLocationsResult : ServerMessage
    {
        public new string Type = "UpdateFleetLocations";
        public List<string> Errors;
    }
    
    public class ServerMessageFlexMatchEvent : ServerMessage
    {
        public new string Type = "FlexMatchEvent";
        public FlexMatchEventDetail FlexMatchEventDetail;
        public string[] Resources;
    }
    
    public class ServerMessageScheduleProgress : ServerMessage
    {
        public new string Type = "ScheduleProgress";
        public VirtualPlayerTaskSchedule Schedule;
        public int ActionIndex;
    }
    
    public class ServerMessageFlexMatchSimulatorEvent : ServerMessage
    {
        public new string Type = "FlexMatchSimulatorEvent";
        public FlexMatchEventDetail FlexMatchEventDetail;
        public string[] Resources;
    }

    public class ServerMessageQueuePlacementEvent : ServerMessage
    {
        public new string Type = "QueuePlacementEvent";
        public QueuePlacementEventDetail QueuePlacementEventDetail;
        public string[] Resources;
    }

    
    public class ServerMessageLaunchVirtualPlayerTasks : ServerMessage
    {
        public new string Type = "LaunchVirtualPlayerTasks";
        public bool Result;
        public int NumPlayers;
    }
    public class ServerMessageLaunchVirtualPlayerTasksProgress : ServerMessage
    {
        public new string Type = "LaunchVirtualPlayerTasksProgress";
        public int NumLaunched;
        public int TotalToLaunch;
    }
    
    public class ServerMessageLaunchSchedule : ServerMessage
    {
        public new string Type = "LaunchVirtualPlayerTaskSchedule";
        public bool Result;
        public List<string> Errors;
    }
    
    public class ServerMessageTerminateSchedule : ServerMessage
    {
        public new string Type = "TerminateVirtualPlayerTaskSchedule";
        public bool Result;
        public List<string> Errors;
    }

}