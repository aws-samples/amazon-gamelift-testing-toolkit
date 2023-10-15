// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using Aws.GameLift;
using Aws.GameLift.Server;
using Newtonsoft.Json;
using SampleGameBuild.NumbersQuiz.Server;

namespace SampleGameBuild.GameLiftIntegration.Server
{
    public class GameLiftHandler
    {
        private IGameLiftServer _gameServer;
        public GameLiftMetadata Metadata;

        public GameLiftHandler(IGameLiftServer gameServer)
        {
            _gameServer = gameServer;
            LoadMetadata();
        }

        public void ProcessInitOutcome(GenericOutcome initOutcome)
        {            
            try
            {
                Console.WriteLine("inited");
                if (initOutcome.Success)
                {
                    Console.WriteLine("Success");
                    _gameServer.OnGameLiftSDKActivationSuccess(initOutcome);
                    ProcessReady();
                }
                else
                {
                    Console.WriteLine("Failed");
                    _gameServer.OnGameLiftSDKActivationFailure(initOutcome);
                }
            }
            catch (Exception e)
            {
                _gameServer.OnGameLiftSDKActivationException(e);
            }
        }
        
        public void InitialiseGameLift(Options options)
        {
            if (options.AnywhereAuthToken!=null && options.AnywhereFleetId!=null && options.AnywhereHostId!=null && options.AnywhereWebSocketUrl!=null)
            {
                Console.WriteLine("Init GameLift Anywhere");
                Process currentProcess = Process.GetCurrentProcess();
                var serverParams = new ServerParameters(options.AnywhereWebSocketUrl, currentProcess.Id.ToString(),
                    options.AnywhereHostId, options.AnywhereFleetId, options.AnywhereAuthToken);
                
                var initOutcome = GameLiftServerAPI.InitSDK(serverParams);
                ProcessInitOutcome(initOutcome);
            }
            else
            {
                Console.WriteLine("Init GameLift Managed");
                try
                {
                    var initOutcome = GameLiftServerAPI.InitSDK();
                    ProcessInitOutcome(initOutcome);
                }
                catch (Exception e)
                {
                    _gameServer.OnGameLiftSDKActivationException(e);
                }
            }
        }

        public static string GetSDKVersion()
        {
            return GameLiftServerAPI.GetSdkVersion().Result;
        }

        public void LoadMetadata()
        {
            string metadataPath = "/local/gamemetadata/gamelift-metadata.json";
            if (File.Exists(metadataPath))
            {
                string metadataText = File.ReadAllText(metadataPath);
                Metadata = JsonConvert.DeserializeObject<GameLiftMetadata>(metadataText);
            }
            else
            {
                Metadata = new GameLiftMetadata()
                {
                    FleetId = "dev-fleet",
                    InstanceRoleArn = "arn:aws:iam::764090017227:role/AGTT-SampleGameStack-Back-GameLiftInstanceRole9AEC-DQQ80S6MKHOV",
                };
            }
            
            _gameServer.OnGameLiftMetadataLoaded(Metadata);
        }

        public bool AcceptPlayerSession(string playerSessionId)
        {
            try
            {
                var outcome = GameLiftServerAPI.AcceptPlayerSession(playerSessionId);
                return outcome.Success;
            }
            catch (Exception e)
            {
                Console.WriteLine ("AcceptPlayerSession() exception " + Environment.NewLine + e.Message);
                return false;
            }
        }

        public bool RemovePlayerSession(string playerSessionId)
        {
            // if player slots never re-open, just skip this entire thing.
            try
            {
                try
                {
                    var outcome = GameLiftServerAPI.RemovePlayerSession(playerSessionId);
                    if (outcome.Success)
                    {
                        Console.WriteLine (":) PLAYER SESSION REMOVED");
                        return true;
                    }
                    else
                    {
                        Console.WriteLine (":( PLAYER SESSION REMOVE FAILED. RemovePlayerSession() returned " + outcome.Error.ToString());
                        return false;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine (":( PLAYER SESSION REMOVE FAILED. RemovePlayerSession() exception " + Environment.NewLine + e.Message);
                    throw;
                }
            }
            catch (KeyNotFoundException e)
            {
                Console.WriteLine (":( INVALID PLAYER SESSION. Exception " + Environment.NewLine + e.Message);
                throw; // should never happen
            }
        }
        
        [MethodImpl(MethodImplOptions.NoInlining)]
        public string GetCurrentMethod()
        {
            var st = new StackTrace();
            var sf = st.GetFrame(1);

            return sf.GetMethod().Name;
        }

        public void TerminateGameSession(bool gameLiftTerminatedSession=false)
        {
            GameLogger.Log(GetCurrentMethod() + ":" + gameLiftTerminatedSession);
            
            if (gameLiftTerminatedSession)
            {
                System.Environment.Exit(0);
            }
            else
            {
                try
                {
                    ProcessEnding();
                }
                catch (Exception e)
                {
                    _gameServer.OnGameLiftProcessEndingException(e);
                    GameLogger.Log (":( GAME SESSION TERMINATION FAILED. TerminateGameSession() exception " + Environment.NewLine + e.Message);
                }
            }

        }

        private void ProcessReady()
        {
            try
            {
                ProcessParameters prParams = new ProcessParameters(
                    /* onStartGameSession */ (gameSession) => {
                        _gameServer.OnGameLiftGameSessionRequested(gameSession);
                        try
                        {
                            var outcome = GameLiftServerAPI.ActivateGameSession();
                            
                            if (outcome.Success)
                            {
                                _gameServer.OnGameLiftGameSessionActivationSuccess(gameSession, outcome);
                            }
                            else
                            {
                                _gameServer.OnGameLiftGameSessionActivationFailure(gameSession, outcome);
                            }
                        }
                        catch (Exception e)
                        { 
                            _gameServer.OnGameLiftGameSessionActivationException(e);
                        }
                    },
                    /* onUpdateGameSession */ (gameSession) =>
                    {
                        
                    },
                    /* onProcessTerminate */ () => {
                        _gameServer.OnGameLiftProcessTerminate();
                    },
                    /* onHealthCheck */ () => {
                        return _gameServer.OnGameLiftHealthCheck();
                    },
                    /* port */ _gameServer.Port, // tell the GameLift service which port to connect to this process on.
                    new LogParameters(new List<string>()
                    {
                        _gameServer.LogFilePath // must be different for each server if multiple servers on instance
                    }));

                var processReadyOutcome = GameLiftServerAPI.ProcessReady(prParams);
                if (processReadyOutcome.Success)
                {
                    _gameServer.OnGameLiftProcessReadySuccess(processReadyOutcome);
                }
                else
                {
                    _gameServer.OnGameLiftProcessReadyFailure(processReadyOutcome);
                }
            }
            catch (Exception e)
            {
                _gameServer.OnGameLiftProcessReadyException(e);
            }
        }

        public void DestroyGameLiftServerAPI()
        {
            GameLiftServerAPI.Destroy();
        }

        private void ProcessEnding()
        {
            try
            {
                var outcome = GameLiftServerAPI.ProcessEnding();
                if (outcome.Success)
                {
                    _gameServer.OnGameLiftProcessEndingSuccess(outcome);
                    GameLogger.Log (":) PROCESSENDING");
                }
                else
                {
                    _gameServer.OnGameLiftProcessEndingFailure(outcome);
                    GameLogger.Log (":( PROCESSENDING FAILED. ProcessEnding() returned " + outcome.Error.ToString());
                }
            }
            catch (Exception e)
            {
                _gameServer.OnGameLiftProcessEndingException(e);
                GameLogger.Log (":( PROCESSENDING FAILED. ProcessEnding() exception " + Environment.NewLine + e.Message);
            }
        }
    }
}