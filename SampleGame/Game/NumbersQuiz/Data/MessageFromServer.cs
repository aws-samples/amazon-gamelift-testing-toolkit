// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using JetBrains.Annotations;

namespace SampleGameBuild.NumbersQuiz.Data
{
    public class MessageFromServer
    {
        public string Text { get; set; }
        public Question Question { get; set; }
        public List<GameResult> Results { get; set; }
        public string Type { get; set; }
        public AnswerResult? AnswerResult { get; set; }
    }
}