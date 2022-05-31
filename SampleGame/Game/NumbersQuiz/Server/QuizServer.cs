// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Runtime.CompilerServices;
using Aws.GameLift;
using Aws.GameLift.Server.Model;
using Newtonsoft.Json;
using SampleGameBuild.GameLiftIntegration.Server;
using SampleGameBuild.Network;
using SampleGameBuild.Network.Server;
using SampleGameBuild.NumbersQuiz.Data;

namespace SampleGameBuild.NumbersQuiz.Server
{
    public class QuizServer : IGameServer, IGameLiftServer
    {
        private GameState _gameState;
        private Players _players;
        public readonly int _port;
        private GameLiftHandler _gameLiftHandler;
        private Stopwatch _connectionTimer;
        private GameSession _gameSession;
        private string _logFilePath;
        private readonly int _numGames;

        public QuizServer(int port, int numGames=15)
        {
            _logFilePath = "/tmp/serverlogs-" + DateTime.Now.ToString("yyyyMMdd-hhmmss") + $"-{port}.txt";
            Console.WriteLine(_logFilePath);
            GameLogger.LogFilePath = _logFilePath;
            _port = port;
            _numGames = numGames;
            _gameState = new GameState();
            _players = new Players();
            _connectionTimer = new Stopwatch();
            _gameLiftHandler = new GameLiftHandler(this);

            Running = true;
        }

        public int Port
        {    
            get { return _port; }    
        }

        public string LogFilePath
        {    
            get { return _logFilePath; }    
        }

        public bool Running { get; private set; }

        public void OnReady()
        {
            GameLogger.Log("GameLift SDK:" + GameLiftHandler.GetSDKVersion());
            _gameLiftHandler.InitGameLift();
        }

        public void OnConnection(TcpClient client)
        {
            _connectionTimer.Reset();
            GameLogger.Log("New Client!");
        }

        public void OnMessage(TcpClient client, string message)
        {
            GameLogger.Log("MESSAGE RECEIVED:" + message);
            _connectionTimer.Reset();
            try
            {
                MessageFromClient messageFromClient = JsonConvert.DeserializeObject<MessageFromClient>(message);

                switch (messageFromClient.Type)
                {
                    case MessageFromClientType.Login:
                        HandleLogin(client, messageFromClient.SessionId, messageFromClient);
                        break;

                    case MessageFromClientType.Answer:
                        HandleAnswer(client, messageFromClient.PlayerId, messageFromClient);
                        break;

                    case MessageFromClientType.Quit:
                        HandleQuit(client, messageFromClient.SessionId, messageFromClient);
                        break;

                    default:
                        GameLogger.Log("Unknown action type");
                        break;
                }
            }
            catch (JsonSerializationException)
            {
                GameLogger.Log("Invalid Game Message!");
            }
            catch (JsonReaderException)
            {
                GameLogger.Log("Invalid JSON!");
            }
        }

        private void HandleLogin(TcpClient client, string sessionId, MessageFromClient messageFromClient)
        {
            if (_gameSession != null)
            {
                _gameLiftHandler.AcceptPlayerSession(sessionId);
            }

            _players.AddPlayer(client, messageFromClient);
            GameLogger.Log(_players.GetConnectedPlayers().Count + " connected players");
        }

        private void HandleQuit(TcpClient client, string sessionId, MessageFromClient messageFromClient)
        {
            if (_gameSession != null)
            {
                _gameLiftHandler.RemovePlayerSession(sessionId);
            }

            OnDisconnection(client);
        }

        public void OnDisconnection(TcpClient client)
        {
            var player = _players.GetPlayerByClient(client);
            if (player != null)
            {
                player.Disconnect();
                if (_gameSession != null)
                {
                    _gameLiftHandler.RemovePlayerSession(player.SessionId);
                }
            }

            NetworkProtocol.DisconnectClient(client);
        }

        public void OnLoop()
        {
            if (_connectionTimer.IsRunning && _connectionTimer.ElapsedMilliseconds/1000 > 300)
            {
                GameLogger.Log("No players connected in 5 minutes, so terminating session");
                _connectionTimer.Stop();
                _connectionTimer.Reset();
                _players.DisconnectAll();
                _gameLiftHandler.TerminateGameSession(false);
                return;
            }

            if (_gameState.GameCounter >= 10)
            {
                GameLogger.Log(_gameState.GameCounter + " games completed, terminating session");
                _players.DisconnectAll();
                _gameLiftHandler.TerminateGameSession(false);
                return;
            }
            
            switch (_gameState.CurrentScheduleEntry().Type)
            {
                case ScheduleEntryType.WaitingForPlayers:
                    HandleWaitingForPlayers();
                    break;

                case ScheduleEntryType.WaitingToStart:
                    HandleWaitingToStart();
                    break;

                case ScheduleEntryType.AskQuestion:
                    HandleAskQuestion();
                    break;
                
                case ScheduleEntryType.WaitingForAnswers:
                    HandleWaitingForAnswers();
                    break;
                
                case ScheduleEntryType.ShowResults:
                    HandleShowResults();
                    break;
                
                case ScheduleEntryType.WaitingForNextGame:
                    HandleWaitingForNextGame();
                    break;
            }
        }

        private void HandleWaitingForPlayers()
        {
            if (_players.GetConnectedPlayers().Count >= _gameState.Config().MinPlayers)
            {
                _gameState.AdvanceSchedule();
            }
        }

        private void HandleWaitingToStart()
        {
            _players.ActivateConnectedPlayers();
            _gameState.AdvanceScheduleAfterTimeElapsed();
        }

        private void HandleAskQuestion()
        {
            _gameState.GetQuestion();
            _players.ResetAnswerStatuses();
            var obj = new MessageFromServer
            {
                Question = _gameState.CurrentQuestion,
                Type = MessageFromServerType.Question
            };
            _players.SendObjectToActivePlayers(obj);

            _gameState.AdvanceSchedule();
        }
        
        private void HandleAnswer(TcpClient client, string PlayerId, MessageFromClient messageFromClient)
        {
            Player player = _players.GetPlayerByPlayerId(PlayerId);
            if (player != null)
            {
                player.CurrentAnswer = messageFromClient.Answer ?? 0;
                if (_gameState.CheckAnswer(player.CurrentAnswer))
                {
                    player.AnswerStatus = AnswerResult.Correct;
                    player.Correct++;
                }
                else
                {
                    player.AnswerStatus = AnswerResult.Wrong;
                    player.Wrong++;
                }
                
                player.SendObject(new MessageFromServer
                {
                    AnswerResult = player.AnswerStatus,
                    Type = MessageFromServerType.Result
                });
            }

            if (_players.PlayersStillToAnswer() == 0)
            {
                _gameState.AdvanceSchedule();
            }
        }
        
        private void HandleWaitingForAnswers()
        {
            _gameState.AdvanceScheduleAfterTimeElapsed();
        }

        private void HandleShowResults()
        {
            var activePlayers = _players.GetActivePlayers();
            var results = new List<GameResult>();
            
            foreach (Player player in activePlayers)
            {
                var gameResult = new GameResult
                {
                    Result = player.AnswerStatus,
                    Name = player.Name,
                    TotalCorrect = player.Correct,
                    TotalWrong = player.Wrong
                };

                results.Add(gameResult);
            }
            
            _players.SendObjectToConnectedPlayers(new MessageFromServer
            {
                Results = results,
                Type = MessageFromServerType.Results
            });
            _gameState.AdvanceSchedule();
        }
        
        private void HandleWaitingForNextGame()
        {
            _gameState.AdvanceScheduleAfterTimeElapsed();
        }

        public void OnShutdown()
        {
            Console.WriteLine(GetCurrentMethod());
        }

        public async void OnGameLiftMetadataLoaded(GameLiftMetadata metadata)
        {
            Console.WriteLine("metadata loaded");
            GameLogger.Log("Loaded metadata:" + JsonConvert.SerializeObject(metadata));
            if (AwsHandler.AssumeInstanceRole(metadata.InstanceRoleArn))
            {
                GameLogger.Log("role assumed");
                await GameLogger.EnableCloudWatch(AwsHandler.Credentials, "/gameserver-logs/", metadata.FleetId + "/unknown-session");
                GameLogger.Log("CloudWatch enabled");
            }
        }

        public void OnGameLiftSDKActivationSuccess(GenericOutcome outcome)
        {
            Console.WriteLine(GetCurrentMethod() + ":" + JsonConvert.SerializeObject(outcome));
        }

        public void OnGameLiftSDKActivationFailure(GenericOutcome outcome)
        {
            Console.WriteLine(GetCurrentMethod() + ":" + JsonConvert.SerializeObject(outcome));
        }

        public void OnGameLiftSDKActivationException(Exception e)
        {
            GameLogger.Log("GameLift SDK Activation:" + e.Message);
        }

        public void OnGameLiftGameSessionRequested(GameSession gameSession)
        {
        }

        public async void OnGameLiftGameSessionActivationSuccess(GameSession gameSession, GenericOutcome outcome)
        {
            _connectionTimer.Reset();
            _connectionTimer.Start();
            _gameSession = gameSession;
            await GameLogger.EnableCloudWatch(AwsHandler.Credentials, "/gameserver-logs/", _gameLiftHandler.Metadata.FleetId + "/" + Path.GetFileName(_gameSession.GameSessionId));
            GameLogger.Log(JsonConvert.SerializeObject(gameSession));
        }

        public void OnGameLiftGameSessionActivationFailure(GameSession gameSession, GenericOutcome outcome)
        {
            GameLogger.Log("Failed to activate game session" + JsonConvert.SerializeObject(gameSession));
        }

        public void OnGameLiftGameSessionActivationException(Exception e)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + e.ToString());
        }

        public void OnGameLiftProcessReadySuccess(GenericOutcome outcome)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + JsonConvert.SerializeObject(outcome));
        }

        public void OnGameLiftProcessReadyFailure(GenericOutcome outcome)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + JsonConvert.SerializeObject(outcome));
        }

        public void OnGameLiftProcessReadyException(Exception e)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + e.ToString());
        }

        public void OnGameLiftProcessTerminate()
        {
            GameLogger.Log(GetCurrentMethod());
            _gameLiftHandler.TerminateGameSession(true);
            _gameSession = null;
        }

        public void OnGameLiftProcessEndingSuccess(GenericOutcome outcome)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + JsonConvert.SerializeObject(outcome)); 
            Running = false;
        }

        public void OnGameLiftProcessEndingFailure(GenericOutcome outcome)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + JsonConvert.SerializeObject(outcome));
            Running = false;
        }

        public void OnGameLiftProcessEndingException(Exception e)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + e.ToString());
            Running = false;
        }

        public bool OnGameLiftHealthCheck()
        {
            GameLogger.Log(GetCurrentMethod());
            return true;
        }
        
        [MethodImpl(MethodImplOptions.NoInlining)]
        public string GetCurrentMethod()
        {
            var st = new StackTrace();
            var sf = st.GetFrame(1);

            return sf.GetMethod().Name;
        }
    }
}