// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using Newtonsoft.Json;
using SampleGameBuild.Network;
using SampleGameBuild.NumbersQuiz.Data;

namespace SampleGameBuild.NumbersQuiz.Server
{
    public class Player
    {
        private TcpClient _client;
        public readonly string Name;
        public readonly string PlayerId;
        public string SessionId;
        public int Correct = 0;
        public int Wrong = 0;
        public int CurrentAnswer = 0;
        public AnswerResult AnswerStatus = AnswerResult.Waiting;
        public bool WaitingForNextSession = true;
        private bool _connected = true;

        public Player(TcpClient client, string playerId, string sessionId, string name)
        {
            PlayerId = playerId;
            SessionId = sessionId;
            _client = client;
            Name = name;
        }

        public void SendMessage(string msg)
        {
            NetworkProtocol.Send(_client, msg);
        }

        public void SendObject(MessageFromServer obj)
        {
            GameLogger.Log("MESSAGE SENT:" + JsonConvert.SerializeObject(obj));
            SendMessage(JsonConvert.SerializeObject(obj, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore }) + "\n");
        }

        public TcpClient GetClient()
        {
            return _client;
        }

        public void Reconnect(TcpClient client, string sessionId)
        {
            _client = client;
            SessionId = sessionId;
            _connected = true;
        }

        public bool IsConnected()
        {
            return _connected;
        }

        public void Disconnect()
        {
            _connected = false;
            WaitingForNextSession = true;
        }
    }
}