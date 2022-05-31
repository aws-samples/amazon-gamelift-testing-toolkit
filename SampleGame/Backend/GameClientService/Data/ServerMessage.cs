// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Newtonsoft.Json;

namespace SampleGameBackend.GameClientService.Data
{
    public class ServerMessage
    {
        [JsonProperty("Type")]
        public string Type { get; set; }

        [JsonProperty("PlayerId")]
        public string PlayerId { get; set; }

        [JsonProperty("SessionId", NullValueHandling = NullValueHandling.Ignore)]
        public string SessionId { get; set; }
        
        [JsonProperty("IpAddress", NullValueHandling = NullValueHandling.Ignore)]
        public string IpAddress { get; set; }
        
        [JsonProperty("Port", NullValueHandling = NullValueHandling.Ignore)]
        public long? Port { get; set; }
        
        [JsonProperty("Message", NullValueHandling = NullValueHandling.Ignore)]
        public string Message { get; set; }
    }
}