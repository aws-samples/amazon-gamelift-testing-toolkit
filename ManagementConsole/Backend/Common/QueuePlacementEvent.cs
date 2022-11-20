// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.Common
{
    public class QueuePlacementEvent : BaseEvent
    {
        [JsonProperty(Required = Required.Default, PropertyName = "detail")]
        public QueuePlacementEventDetail Detail { get; set; }
    }
    
    public class QueuePlacementEventDetail
    {
        [JsonProperty(Required = Required.Always, PropertyName = "type")]
        public string Type { get; set; }
        
        [JsonProperty(Required = Required.Always, PropertyName = "placementId")]
        public string PlacementId { get; set; }
        
        [JsonProperty(Required = Required.Default, PropertyName = "port")]
        public string Port { get; set; }

        [JsonProperty(Required = Required.Default, PropertyName = "gameSessionArn")]
        public string GameSessionArn { get; set; }

        [JsonProperty(Required = Required.Default, PropertyName = "ipAddress")]
        public string IpAddress { get; set; }
        
        [JsonProperty(Required = Required.Default, PropertyName = "dnsName")]
        public string DnsName { get; set; }
        
        [JsonProperty(Required = Required.Default, PropertyName = "gameSessionRegion")]
        public string GameSessionRegion { get; set; }
        
        [JsonProperty(Required = Required.Always, PropertyName = "startTime")]
        public string StartTime { get; set; }
        
        [JsonProperty(Required = Required.Always, PropertyName = "endTime")]
        public string EndTime { get; set; }
        
        [JsonProperty(Required = Required.Default, PropertyName = "placedPlayerSessions")]
        public List<QueuePlacementEventPlacedPlayerSession> PlacedPlayerSessions { get; set; }
    }

    public class QueuePlacementEventPlacedPlayerSession
    {
        [JsonProperty(Required = Required.Always, PropertyName = "playerId")]
        public string PlayerId { get; set; }
        
        [JsonProperty(Required = Required.Always, PropertyName = "playerSessionId")]
        public string PlayerSessionId { get; set; }
    }
}