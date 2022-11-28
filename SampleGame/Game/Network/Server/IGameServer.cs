// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Net.Sockets;

namespace SampleGameBuild.Network.Server
{
    public interface IGameServer
    {
        int Port { get; }
        bool Running { get; }

        void OnReady();
        void OnConnection(TcpClient client);
        void OnMessage(TcpClient client, string message);
        void OnDisconnection(TcpClient client);
        void OnLoop();
        void OnAllClientsDisconnected();
        void OnShutdown();
    }
}
