// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class PlayerProfile
    {
        [DynamoDBHashKey]
        public string ProfileId;
        
        [DynamoDBProperty("ProfileName")]
        public string Name;
        
        [DynamoDBProperty("Team")]
        public string Team;
        
        [DynamoDBProperty("Attributes")]
        public List<PlayerProfileAttribute> Attributes;
    }

    [JsonConverter(typeof(PlayerProfileAttributeConverter))]
    public abstract class PlayerProfileAttribute
    {
        public string AttributeName;
        public string AttributeType;
        public string ValueType;
    }

    public class PlayerStringAttribute : PlayerProfileAttribute
    {
        public string Value;
    }
    
    public class PlayerNumberAttribute : PlayerProfileAttribute
    {
        public double Value;
    }
    
    public class PlayerDoubleMapAttribute : PlayerProfileAttribute
    {
        public Dictionary<string, double> ValueMap;
    }
    
    public class PlayerRandIntegerAttribute : PlayerProfileAttribute
    {
        public int Min;
        public int Max;
    }
    
    public class PlayerRandDoubleAttribute : PlayerProfileAttribute
    {
        public double Min;
        public double Max;
    }

    public class PlayerStringListAttribute : PlayerProfileAttribute
    {
        public string[] Value;
    }
    
    public class PlayerRandStringListAttribute : PlayerProfileAttribute
    {
        public int Min;
        public int Max;
        public string[] Value;
    }
}