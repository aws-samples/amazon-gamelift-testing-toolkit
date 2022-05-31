// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Net.Sockets;
using Newtonsoft.Json;
using SampleGameBuild.Network;
using SampleGameBuild.Network.Client;
using SampleGameBuild.NumbersQuiz.Data;
using Random = System.Random;

namespace SampleGameBuild.NumbersQuiz.Client
{
    public class QuizClient : IGameClient, IDisposable  
    {
        private TcpClient _client;
        private string _playerId;
        private string _sessionId;
        private bool _active = true;
        private bool disposedValue;

        public QuizClient(string playerId, string sessionId=null)
        {
            _playerId = playerId;
            _sessionId = sessionId;
        }

        public void OnConnect(TcpClient client)
        {
            _client = client;
            Login();
        }

        public void OnMessage(string message)
        {
            Console.WriteLine(message);
            var messageFromServer = JsonConvert.DeserializeObject<MessageFromServer>(message);
            switch (messageFromServer.Type)
            {
                case MessageFromServerType.Question:
                    AnswerQuestion(messageFromServer.Question);
                    break;

                case MessageFromServerType.Results:
                    //Console.WriteLine(message);
                    break;
            }
        }
        
        public void Login()
        {
            //_playerId = Guid.NewGuid().ToString();
            Random rnd = new Random();
            var message = new MessageFromClient
            {
                Type = MessageFromClientType.Login,
                PlayerId = _playerId,
                SessionId = _sessionId,
                Name = "Player " + rnd.Next(1,10000)
            };
            
            SendObject(message);
        }

        public void OnDisconnect()
        {
            _active = false;
        }

        public void AnswerQuestion(Question question)
        {
            int answer;
            if (question.Operand == "*")
            {
                answer = question.Number1 * question.Number2;
            }
            else
            {
                answer = question.Number1 + question.Number2;
            }
            
            Random rnd = new Random();
            if (rnd.NextDouble() >= 0.5)
            {
                answer += 1;
            }
            
            var message = new MessageFromClient
            {
                Type = MessageFromClientType.Answer,
                PlayerId = _playerId,
                SessionId = _sessionId,
                Answer = answer
            };
            
            SendObject(message);
        }
        
        public void SendMessage(string msg)
        {
            Console.WriteLine("SENT:"+msg);
            NetworkProtocol.Send(_client, msg);
        }

        public void SendObject(MessageFromClient obj)
        {
            var json = JsonConvert.SerializeObject(obj,
                new JsonSerializerSettings() {NullValueHandling = NullValueHandling.Ignore});
            SendMessage( json + "\n");
        }

        public bool IsActive()
        {
            return _active;
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    _client?.Dispose();
                }

                _client = null;
                disposedValue = true;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}