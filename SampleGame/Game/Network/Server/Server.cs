// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using System;
using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace SampleGameBuild.Network.Server
{
    public class Server : IDisposable
    {
        private TcpListener _listener;
        private List<TcpClient> _clients;
        private IGameServer _gameServer;
        private bool disposedValue;

        public bool Running { get; private set; }

        public Server(int port, IGameServer gameServer)
        {
            _gameServer = gameServer;
            _clients = new List<TcpClient>();
            
            Console.WriteLine("server started");
            if (StartListener(port))
            {
                _gameServer.OnReady();
                Running = true;
            }
        }

        private bool StartListener(int port)
        {
            var started = false;

            try
            {
                _listener = new TcpListener(IPAddress.Any, port);
                _listener.Start();
                started = true;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }

            return started;
        }

        public void OnLoop()
        {
            if (_listener.Pending())
            {
                TcpClient client = _listener.AcceptTcpClient();
                _gameServer.OnConnection(client);
                _clients.Add(client);
                return;
            }

            foreach (TcpClient client in _clients)
            {
                if (client != null)
                {
                    try
                    {
                        if (client.Client.Poll(1, SelectMode.SelectRead) && !client.GetStream().DataAvailable)
                        {
                            HandleDisconnect(client);
                            return;
                        }
                    }
                    catch (ObjectDisposedException)
                    {
                        _clients.Remove(client);
                        return;
                    }

                    var messages = NetworkProtocol.Receive(client);
                    foreach (string msgStr in messages)
                    {
                        _gameServer.OnMessage(client, msgStr);
                    }
                }
            }

            _gameServer.OnLoop();
            Running = _gameServer.Running;
        }

        private void HandleDisconnect(TcpClient client)
        {
            _gameServer.OnDisconnection(client);
            _clients.Remove(client);
            Console.WriteLine(_clients.Count + " connected clients remaining");
            if (_clients.Count == 0)
            {
                _gameServer.OnAllClientsDisconnected();
            }
        }

        //public void Shutdown()
        //{
        //    foreach (TcpClient client in _clients)
        //    {
        //        _gameServer.OnDisconnection(client);
        //        _clients.Remove(client);
        //    }

        //    _listener.Stop();
        //    _gameServer.OnShutdown();

        //    Running = false;
        //}

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    foreach (var client in _clients)
                    {
                        client?.Dispose();
                    }
                }

                disposedValue = true;
                Running = false;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}