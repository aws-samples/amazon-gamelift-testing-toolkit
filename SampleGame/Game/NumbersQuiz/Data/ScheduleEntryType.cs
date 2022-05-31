// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

namespace SampleGameBuild.NumbersQuiz.Data
{
    public class ScheduleEntryType
    {
        public const string WaitingForPlayers = "WAITING_FOR_PLAYERS";
        public const string WaitingToStart = "WAITING_TO_START";
        public const string AskQuestion = "ASK_QUESTION";
        public const string WaitingForAnswers = "WAITING_FOR_ANSWERS";
        public const string ShowResults = "SHOW_RESULTS";
        public const string WaitingForNextGame = "WAITING_FOR_NEXT_GAME";
    }
}