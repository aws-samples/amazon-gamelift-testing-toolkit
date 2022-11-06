// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;
using Amazon.GameLift.Model;
using ManagementConsoleBackend.Common;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class MatchmakingSimulation
    {
        [DynamoDBHashKey]
        public string SimulationId;
        
        [DynamoDBProperty("Date")] 
        public string Date;

        [DynamoDBProperty("RuleSet")] 
        public string RuleSet;
        
        [DynamoDBProperty("PlayersConfig")] 
        public List<MatchmakingSimulationPlayerConfig> PlayersConfig;

        [DynamoDBProperty("Status")] 
        public string Status;
        
        [DynamoDBProperty("Tickets")]
        public List<string> Tickets { get; set; }
        
        [DynamoDBProperty("PlayersMatched")]
        public int PlayersMatched;

        [DynamoDBProperty("PlayersFailed")]
        public int PlayersFailed;

        [DynamoDBProperty("MatchesMade")]
        public int MatchesMade;

        [DynamoDBProperty("MatchesFailed")]
        public int MatchesFailed;
        
        [DynamoDBProperty("MatchmakingSucceededEvents")]
        public int MatchmakingSucceededEvents;
        
        [DynamoDBProperty("MatchmakingSearchingEvents")]
        public int MatchmakingSearchingEvents;

        [DynamoDBProperty("PotentialMatchCreatedEvents")]
        public int PotentialMatchCreatedEvents;

        [DynamoDBProperty("MatchmakingTimedOutEvents")]
        public int MatchmakingTimedOutEvents;

        [DynamoDBProperty("MatchmakingFailedEvents")]
        public int MatchmakingFailedEvents;
        
        [DynamoDBProperty("MatchmakingCancelledEvents")]
        public int MatchmakingCancelledEvents;
        
        [DynamoDBProperty("LastUpdateSent")]
        public long LastUpdateSent;
    }

    public class MatchmakingSimulationPlayerConfig
    {
        public string ProfileId;
        public int NumPlayers;
        public string LatencyProfileId;
        public int TimeDelay;
    }
    
    public class MatchmakingSimulationPlayer
    {
        [DynamoDBHashKey]
        public string SimulationId;
        
        [DynamoDBRangeKey]
        public string PlayerId;
        public string ProfileId;
        public string ProfileName;
        public string MatchedTeam;
        public Player PlayerData;
        public string LatencyProfileId;
        public int TimeDelay;
        public bool MatchedSuccessfully = false;
        public long StartMatchTime;
        public long EndMatchTime;
        public string TicketId;

    }

    public class PlayerAttribute
    {
        
    }

    public class MatchResultData
    {
        [DynamoDBHashKey]
        public string SimulationId;
        
        [DynamoDBRangeKey]
        public string MatchId;
        
        [DynamoDBProperty("MatchedSuccessfully")]
        public bool MatchedSuccessfully=false;

        [DynamoDBProperty("MatchTicketStatus")]
        public string MatchTicketStatus;

        [DynamoDBProperty("NumPlayers")]
        public int NumPlayers;
        
        [DynamoDBProperty("RuleEvaluationMetrics")]
        public List<FlexMatchRuleEvaluationMetric> RuleEvaluationMetrics;
        
        [DynamoDBProperty("Date")]
        public string Date;

        [DynamoDBProperty("Players")] 
        public List<MatchmakingSimulationPlayer> Players;
    }
}