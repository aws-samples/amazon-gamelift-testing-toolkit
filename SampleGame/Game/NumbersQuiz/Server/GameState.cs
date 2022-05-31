// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using CommandLine;
using Newtonsoft.Json;
using SampleGameBuild.NumbersQuiz.Data;
using Random = System.Random;

namespace SampleGameBuild.NumbersQuiz.Server
{
    public class GameState
    {
        private int _scheduleIndex = 0;
        private QuizConfig _config = null;
        private Stopwatch _timer;
        public Question CurrentQuestion = null;
        private int _gameCounter=0;
        
        public int GameCounter
        {    
            get    
            {    
                return _gameCounter;
            }    
        }
        
        public GameState()
        {
            LoadConfig();
            _timer = new Stopwatch();
        }

        public ScheduleEntry CurrentScheduleEntry()
        {
            return _config.Schedule[_scheduleIndex];
        }

        public string CurrentActionType()
        {
            return _config.Schedule[_scheduleIndex].Type;
        }

        public void AdvanceSchedule()
        {
            _timer.Stop();
            if (_scheduleIndex + 1 < _config.Schedule.Count)
            {
                _scheduleIndex++;
            }
            else // move back to the beginning
            {
                _scheduleIndex = 0;
                _gameCounter++;
            }
            
            int timeToWait = CurrentScheduleEntry().Time ?? 0;
            if (timeToWait > 0)
            {
                _timer.Reset();
                _timer.Start();
            }
            
            GameLogger.Log("NEW SCHEDULE ENTRY:" + CurrentScheduleEntry().Type);
        }

        public void AdvanceScheduleAfterTimeElapsed()
        {
            ScheduleEntry entry = CurrentScheduleEntry();
            int timeToWait = entry.Time ?? 0;
            if (timeToWait > 0 && _timer.ElapsedMilliseconds >= timeToWait)
            {
                AdvanceSchedule();
            }
        }

        public void ResetGameState()
        {
            _scheduleIndex = 0;
        }

        public QuizConfig Config()
        {
            return _config;
        }

        private void LoadConfig()
        {
            string configText = System.IO.File.ReadAllText(Directory.GetCurrentDirectory() + "/QuizConfig.json");
            _config = JsonConvert.DeserializeObject<QuizConfig>(configText);
        }

        public void GetQuestion()
        {
            Random rnd = new Random();

            string displayOperand = "+";
            string operand = "+";
            if (rnd.NextDouble() >= 0.5)
            {
                operand = "*";
                displayOperand = "x";
            }

            int number1 = rnd.Next(2, 51);
            int number2 = rnd.Next(2, 51);

            CurrentQuestion = new Question
            {
                Number1 = number1,
                Number2 = number2,
                Text = "What is " + number1 + " " + displayOperand + " " + number2 + "?",
                Operand = operand
            };
        }

        public bool CheckAnswer(int playerAnswer)
        {
            int answer;
            if (CurrentQuestion.Operand == "*")
            {
                answer = CurrentQuestion.Number1 * CurrentQuestion.Number2;
            }
            else
            {
                answer = CurrentQuestion.Number1 + CurrentQuestion.Number2;
            }

            if (playerAnswer == answer)
            {
                return true;
            }

            return false;
        }
    }
}