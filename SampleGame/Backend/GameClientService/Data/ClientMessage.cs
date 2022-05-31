// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Newtonsoft.Json;

namespace SampleGameBackend.GameClientService.Data
{
    public class ClientMessage
    {
        [JsonProperty(Required = Required.Always)] public string Type;
        [JsonProperty(Required = Required.Default)] public string PlayerId;
    }
}