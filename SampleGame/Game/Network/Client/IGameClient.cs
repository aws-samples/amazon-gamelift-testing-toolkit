// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Net.Sockets;

namespace SampleGameBuild.Network.Client
{
    public interface IGameClient
    {
        void OnConnect(TcpClient client);
        void OnMessage(string message);
        
        void OnDisconnect();

        bool IsActive();

    }
}