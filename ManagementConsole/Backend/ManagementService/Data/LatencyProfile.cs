// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class LatencyProfile
    {
        [DynamoDBHashKey]
        public string ProfileId;
        
        [DynamoDBProperty("ProfileName")]
        public string Name;

        [DynamoDBProperty("Attributes")]
        public List<RegionLatency> LatencyData;
    }
    
    public class RegionLatency
    {
        public string Region;
        public int MinLatency;
        public int MaxLatency;
    }
}