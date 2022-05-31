// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Net.Sockets;

namespace SampleGameBuild.Network.Client
{
    public class Client : IClient, IDisposable
    {
        private TcpClient _client = null;
        private IGameClient _gameClient;
        protected bool connected = true;
        private bool disposedValue;

        public Client(string ip, int port, IGameClient gameClient)
        {
            _gameClient = gameClient;
            if (Connect(ip, port))
            {
                gameClient.OnConnect(_client);
                Running = true;
            }
        }

        public bool Running { get; private set; }

        private bool Connect(string ip, int port)
        {
            try
            {
                _client = new TcpClient(ip, port);                
                return true;
            }
            catch (SocketException sex)
            {
                _client = null; 
                return false;
            }
        }
        
        public void OnLoop()
        {
            if (_client == null)
            {
                return;
            }

            var messages = NetworkProtocol.Receive(_client);
            if (messages.Length > 0)
            {
                foreach (string msgStr in messages)
                {
                    _gameClient.OnMessage(msgStr);
                }
            }
            
            try
            {
                if (_client.Client.Poll(1, SelectMode.SelectRead) && !_client.GetStream().DataAvailable)
                {
                    _gameClient.OnDisconnect();
                    return;
                }
            }
            catch (ObjectDisposedException)
            {
                _gameClient.OnDisconnect();
            }
        }

        public bool IsActive()
        {
            return _gameClient.IsActive();
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    _client?.Dispose();
                }

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