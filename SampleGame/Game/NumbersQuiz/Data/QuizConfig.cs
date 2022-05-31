// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;

namespace SampleGameBuild.NumbersQuiz.Data
{
    public class QuizConfig
    {
        public int MinPlayers { get; set; }
        public int MaxPlayers { get; set; }
        public List<ScheduleEntry> Schedule { get; set; }
    }
}