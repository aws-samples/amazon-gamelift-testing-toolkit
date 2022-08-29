// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Threading.Tasks;
using Amazon;
using Amazon.CognitoIdentity;
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
        
        private bool _isServer = true;
        private string _wsUrl;
        private string _playerId;
        private Options _options;
        
        public Game(Options options)
        {
            Console.WriteLine(Newtonsoft.Json.JsonConvert.SerializeObject(options));
            
            _options = options;
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

        public async void RunClient()
        {
            // Initialize the Amazon Cognito credentials provider
            CognitoAWSCredentials credentials = new CognitoAWSCredentials(
                _options.IdentityPoolId, // Identity pool ID
                RegionEndpoint.GetBySystemName(_options.IdentityPoolRegion) // Region
            );
            
            var creds = credentials.GetCredentials();
            var identityId = await credentials.GetIdentityIdAsync();
            var apiGatewayRequestSigner = new APIGatewayRequestSigner(_options.IdentityPoolRegion);
            
            _playerId = Guid.NewGuid().ToString();

            if (_wsUrl != null)
            {
                var signedWebSocketUrl = apiGatewayRequestSigner.GenerateSignedUrl(_options.WSUrl, creds);
                var client = new WSClient(signedWebSocketUrl, _playerId);
                RunClient(client);
            }
            else
            {
                using var quizClient = new QuizClient(_playerId, Guid.NewGuid().ToString());
                using var client = new Client(_options.ServerHost, _options.Port, quizClient);
                RunClient(client);
            }
        }

        public void RunServer()
        {
            using var server = new Server(_options.Port, new QuizServer(_options.Port));
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