// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using SampleGameBuild.Network.Client;
using SampleGameBuild.NumbersQuiz.Client;
using Websocket.Client;

namespace SampleGameBuild.GameLiftIntegration.Client
{
    public class WSClient : IClient, IDisposable
    {
        private Network.Client.Client _gameClient;

        private WebsocketClient _webSocket;
        private string _playerId;
        private bool _matchmakingInProgress = false;
        private Task _pingTask;
        private bool _disposedValue;

        public WSClient(string webSocketUrl, string playerId)
        {
            _playerId = playerId;
            
            var factory = new Func<ClientWebSocket>(() =>
            {
                var client = new ClientWebSocket
                {
                    Options =
                    {
                        KeepAliveInterval = TimeSpan.FromSeconds(5),
                    }
                };
                return client;
            });
            
            Console.WriteLine("Trying to connect to " + webSocketUrl);
            _webSocket = new WebsocketClient(new Uri(webSocketUrl), factory);

            _webSocket.IsReconnectionEnabled = false;
            
            _webSocket.ReconnectionHappened.Subscribe(info =>
            {
                OnConnected();
            });
            
            _webSocket.MessageReceived.Subscribe(msg =>
            {
                var rawJson = msg.Text;
                var message = JsonConvert.DeserializeObject <WSMessageFromServer>(rawJson);
                if (message.Type == "MatchmakingSucceeded")
                {
                    _gameClient = new Network.Client.Client(message.IpAddress, Convert.ToInt32(message.Port),
                        new QuizClient(message.PlayerId, message.SessionId));
                    
                    _matchmakingInProgress = false;
                }

                if (message.Type == "MatchmakingTimedOut")
                {
                    RequestMatch();
                }
            });

            _pingTask = Task.Run(StartSendingPing);
            
            Connect();

            Running = true;
        }

        public bool Running { get; private set; }

        private async Task StartSendingPing()
        {
            while (true)
            {
                await Task.Delay(30000);

                if(!_webSocket.IsRunning)
                    continue;

                _webSocket.Send("/ping");
            }
        }

        private void OnConnected()
        {
            Console.WriteLine("OnConnected!");
            RequestMatch();
        }

        private void RequestMatch()
        {
            _matchmakingInProgress = true;
            var msg = new WSMessageFromClient();
            msg.Type = "StartMatchmaking";
            msg.PlayerId = _playerId;
            Task.Run(() => _webSocket.Send(JsonConvert.SerializeObject(msg)));
        }
        
        public async void Connect()
        {
            await _webSocket.Start();
        }
        
        public void OnLoop()
        {
            if (_gameClient != null)
            {
                _gameClient.OnLoop();
                if (_matchmakingInProgress==false && _gameClient.IsActive()==false)
                {
                    RequestMatch();
                }
            }

        }

        public bool IsActive()
        {
            return _gameClient.IsActive();
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposedValue)
            {
                if (disposing)
                {
                    _pingTask.Dispose();
                    _webSocket.Dispose();
                    _gameClient.Dispose();
                }

                _pingTask = null;
                _webSocket = null;
                _gameClient = null;
                _disposedValue = true;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}