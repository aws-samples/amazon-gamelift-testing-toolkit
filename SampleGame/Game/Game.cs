// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Threading.Tasks;
using SampleGameBuild.GameLiftIntegration.Client;
using SampleGameBuild.Network.Client;
using SampleGameBuild.Network.Server;
using SampleGameBuild.NumbersQuiz.Client;
using SampleGameBuild.NumbersQuiz.Server;

namespace SampleGameBuild
{
    class Game
    {
        private const int loopDelay = 200;

        private int _port;
        private string _serverHost;
        private bool _isServer = true;
        private string _wsUrl;
        private string _playerId;
        private Options _options;
        
        public Game(Options options)
        {
            Console.WriteLine(Newtonsoft.Json.JsonConvert.SerializeObject(options));
            
            _options = options;
            _port = options.Port;
            _serverHost = options.ServerHost;
            _wsUrl = options.WSUrl;
            _isServer = (options.Type == "server");
        }

        public void StartLoop()
        {
            Console.WriteLine("Start loop!");

            if (_isServer)
            {
                RunServer();
            }
            else
            {
                RunClient();
            }

            Console.WriteLine("loop broken");
        }

        public void RunClient()
        {
            _playerId = Guid.NewGuid().ToString();

            if (_wsUrl != null)
            {
                var client = new WSClient(_wsUrl, _playerId);
                RunClient(client);
            }
            else
            {
                using var quizClient = new QuizClient(_playerId, Guid.NewGuid().ToString());
                using var client = new Client(_serverHost, _port, quizClient);
                RunClient(client);
            }
        }

        public void RunServer()
        {
            using var server = new Server(_port, new QuizServer(_port));
            while (server.Running)
            {
                server.OnLoop();
                Task.Delay(loopDelay);
            }
        }

        private static void RunClient(IClient client)
        {
            while (client.Running)
            {
                client.OnLoop();
                Task.Delay(loopDelay);
            }
        }
    }
}