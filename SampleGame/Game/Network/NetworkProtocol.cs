// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Net.Sockets;
using System.Collections.Generic;

namespace SampleGameBuild.Network
{
    public static class NetworkProtocol
    {
        public static string[] Receive(TcpClient client)
        {
            var stream = client.GetStream();
            var messages = new List<string>();

            while (stream.DataAvailable)
            {
                int msgSize = 4096;
                byte[] readBuffer = new Byte[msgSize];
                stream.Read(readBuffer, 0, readBuffer.Length);
                string msgStr = System.Text.Encoding.ASCII.GetString(readBuffer, 0, readBuffer.Length);

                char[] delims = { '\r', '\n' };
                string[] splitMessages = msgStr.Split(delims, StringSplitOptions.RemoveEmptyEntries);

                foreach (string splitMessage in splitMessages)
                {
                    if (splitMessage.Trim('\0').Length > 0)
                    {
                        messages.Add(splitMessage);
                    }
                }
            }

            return messages.ToArray();
        }

        public static void Send(TcpClient client, string msgStr)
        {
            if (client == null)
            {
                return;
            }

            var stream = client.GetStream();
            byte[] writeBuffer = System.Text.Encoding.ASCII.GetBytes(msgStr);
            int msgSize = writeBuffer.Length;
            stream.Write(writeBuffer, 0, msgSize);
        }
    
        public static void DisconnectClient(TcpClient client)
        {
            if (client == null)
            {
                return;
            }

            var stream = client.GetStream();
            stream?.Close();
            client.Close();
            client = null;
        }
    }
}
