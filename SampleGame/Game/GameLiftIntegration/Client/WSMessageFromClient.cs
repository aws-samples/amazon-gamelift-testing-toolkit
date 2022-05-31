// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Newtonsoft.Json;

namespace SampleGameBuild.GameLiftIntegration.Client
{
    public class WSMessageFromClient
    {
        [JsonProperty(Required = Required.Always)] public string Type;
        [JsonProperty(Required = Required.Always)] public string PlayerId;
    }
}