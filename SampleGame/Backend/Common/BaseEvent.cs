// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using Newtonsoft.Json;

namespace SampleGameBackend.Common
{
    public class BaseEvent
    {
        [JsonProperty("version")]
        public string Version { get; set; }
        
        [JsonProperty("id")] 
        public Guid Id { get; set; }

        [JsonProperty("detail-type")]
        public string DetailType { get; set; }
        
        [JsonProperty("source")]
        public string Source { get; set; }
        
        [JsonProperty("account")]
        public string Account { get; set; }
        
        [JsonProperty("time")]
        public DateTimeOffset Time { get; set; }
        
        [JsonProperty("region")]
        public string Region { get; set; }
        
        [JsonProperty("resources")]
        public string[] Resources { get; set; }
    }
}