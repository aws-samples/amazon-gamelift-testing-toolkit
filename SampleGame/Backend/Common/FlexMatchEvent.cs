// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;

namespace SampleGameBackend.Common
{
    public class FlexMatchEvent : BaseEvent
    {
        [JsonProperty("detail")]
        public FlexMatchEventDetail Detail { get; set; }
    }

    public class FlexMatchTicket
    {
        public string TicketId;
        public List<FlexMatchEvent> Events;
        public DateTimeOffset Date;
    }
    

    
    public class TicketTableDocument
    {
        [DynamoDBHashKey]
        public string TicketId { get; set; }

        [DynamoDBProperty("time")]
        public DateTime Time { get; set; }

        [DynamoDBProperty("events")]
        public List<string> Events { get; set; }
        
        [DynamoDBProperty("lastEventType")]
        public string LastEventType { get; set; }
    }

    public class FlexMatchEventDetail
    {
        [JsonProperty("tickets")]
        public List<FlexMatchEventTicket> Tickets { get; set; }
        
        [JsonProperty("estimatedWaitMillis", NullValueHandling = NullValueHandling.Ignore)]
        public string EstimatedWaitMillis { get; set; }
        
        [JsonProperty("type")]
        public string Type { get; set; }
        
        [JsonProperty("gameSessionInfo", NullValueHandling = NullValueHandling.Ignore)]
        public FlexMatchGameSessionInfo GameSessionInfo { get; set; }
        
        [JsonProperty("matchId", NullValueHandling = NullValueHandling.Ignore)]
        public string MatchId { get; set; }
        
        [JsonProperty("acceptanceTimeout", NullValueHandling = NullValueHandling.Ignore)]
        public long? AcceptanceTimeout { get; set; }
        
        [JsonProperty("acceptanceRequired", NullValueHandling = NullValueHandling.Ignore)]
        public bool? AcceptanceRequired { get; set; }

        [JsonProperty("reason", NullValueHandling = NullValueHandling.Ignore)]
        public string Reason { get; set; }

        [JsonProperty("message", NullValueHandling = NullValueHandling.Ignore)]
        public string Message { get; set; }

        [JsonProperty("customEventData", NullValueHandling = NullValueHandling.Ignore)]
        public string CustomEventData { get; set; }
        
        [JsonProperty("ruleEvaluationMetrics", NullValueHandling = NullValueHandling.Ignore)]
        public List<FlexMatchRuleEvaluationMetric> RuleEvaluationMetrics { get; set; }
    }

    public class FlexMatchRuleEvaluationMetric
    {
        [JsonProperty("ruleName")] 
        public string RuleName { get; set; }
        
        [JsonProperty("passedCount")] 
        public long? PassedCount { get; set; }
        
        [JsonProperty("failedCount")] 
        public long? FailedCount { get; set; }
    }
    
    public class FlexMatchEventTicket
    {
        [JsonProperty("ticketId")] 
        public string TicketId { get; set; }
        
        [JsonProperty("startTime")] 
        public DateTimeOffset StartTime { get; set; }
        
        [JsonProperty("players")] 
        public List<FlexMatchEventPlayer> Players { get; set; }
    }

    public class FlexMatchEventPlayer
    {
        [JsonProperty("playerId")] 
        public string PlayerId { get; set; }

        [JsonProperty("playerSessionId", NullValueHandling = NullValueHandling.Ignore)] 
        public string PlayerSessionId { get; set; }
        
        [JsonProperty("team", NullValueHandling = NullValueHandling.Ignore)] 
        public string Team { get; set; }
        
        [JsonProperty("accepted", NullValueHandling = NullValueHandling.Ignore)] 
        public bool? Accepted { get; set; }
    }

    public class FlexMatchGameSessionInfo
    {
        [JsonProperty("players")] 
        public List<FlexMatchEventPlayer> Players { get; set; }
        
        [JsonProperty("gameSessionArn", NullValueHandling = NullValueHandling.Ignore)] 
        public string GameSessionArn { get; set; }
        
        [JsonProperty("ipAddress", NullValueHandling = NullValueHandling.Ignore)] 
        public string IPAddress { get; set; }
        
        [JsonProperty("port", NullValueHandling = NullValueHandling.Ignore)] 
        public long? Port { get; set; }
    }
}