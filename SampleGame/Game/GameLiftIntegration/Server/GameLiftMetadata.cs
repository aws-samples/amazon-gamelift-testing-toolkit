// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Newtonsoft.Json;

namespace SampleGameBuild.GameLiftIntegration.Server
{
    public class GameLiftMetadata
    {
        [JsonProperty("buildArn")]
        public string BuildArn { get; set; }

        [JsonProperty("buildId")]
        public string BuildId { get; set; }

        [JsonProperty("fleetArn")]
        public string FleetArn { get; set; }

        [JsonProperty("fleetDescription")]
        public string FleetDescription { get; set; }

        [JsonProperty("fleetId")]
        public string FleetId { get; set; }

        [JsonProperty("fleetName")]
        public string FleetName { get; set; }

        [JsonProperty("fleetType")]
        public string FleetType { get; set; }

        [JsonProperty("instanceRoleArn")]
        public string InstanceRoleArn { get; set; }

        [JsonProperty("instanceType")]
        public string InstanceType { get; set; }

        [JsonProperty("serverLaunchPath")]
        public string ServerLaunchPath { get; set; }
        
    }
}