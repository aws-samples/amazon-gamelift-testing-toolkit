// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using JetBrains.Annotations;
using Newtonsoft.Json;

namespace SampleGameBuild.NumbersQuiz.Data
{
    public class MessageFromClient
    {
            [JsonProperty(Required = Required.Always)] public string Type;
            [JsonProperty(Required = Required.Always)] public string PlayerId;
            [JsonProperty("SessionId", NullValueHandling = NullValueHandling.Ignore)] public string SessionId;
            [JsonProperty("Name", NullValueHandling = NullValueHandling.Ignore)] public string Name;
            public int? Answer;
    }
}