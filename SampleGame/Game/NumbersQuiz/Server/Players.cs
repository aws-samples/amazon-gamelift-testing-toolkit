// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Net.Sockets;
using Newtonsoft.Json;
using SampleGameBuild.NumbersQuiz.Data;

namespace SampleGameBuild.NumbersQuiz.Server
{
    public class Players
    {
        private Dictionary<string, Player> _players;

        public Players()
        {
            _players = new Dictionary<string, Player>();
        }

        public void AddPlayer(TcpClient client, MessageFromClient messageFromClient)
        {
            var serverMessage = new MessageFromServer();
            
            if (_players.ContainsKey(messageFromClient.PlayerId) == false)
            {
                // create new player
                _players[messageFromClient.PlayerId] = new Player(client, messageFromClient.PlayerId, messageFromClient.SessionId, messageFromClient.Name);
                serverMessage.Text = "Welcome " + _players[messageFromClient.PlayerId].Name;
            }
            else
            {
                // reconnect existing player
                _players[messageFromClient.PlayerId].Reconnect(client, messageFromClient.SessionId);
                serverMessage.Text = "Welcome back " + _players[messageFromClient.PlayerId].Name;
            }

            _players[messageFromClient.PlayerId].SendObject(serverMessage);
        }

        public Player GetPlayerByClient(TcpClient client)
        {
            foreach (Player player in _players.Values)
            {
                if (player.GetClient() == client)
                {
                    return player;
                }
            }

            return null;
        }
        
        public Player GetPlayerByPlayerId(string PlayerId)
        {
            if (PlayerId==null || _players.ContainsKey(PlayerId) == false)
            {
                return null;
            }
            
            return _players[PlayerId];
        }

        public List<Player> GetConnectedPlayers()
        {
            var connectedPlayers = new List<Player>();

            foreach (Player player in _players.Values)
            {
                if (player.IsConnected())
                {
                    connectedPlayers.Add(player);
                }
            }
            
            return connectedPlayers;
        }
        
        public List<Player> GetActivePlayers()
        {
            var activePlayers = new List<Player>();

            foreach (Player player in _players.Values)
            {
                if (player.IsConnected() && player.WaitingForNextSession==false)
                {
                    activePlayers.Add(player);
                }
            }

            return activePlayers;
        }
        
        public void ResetAnswerStatuses()
        {
            foreach (var player in _players.Values)
            {
                _players[player.PlayerId].AnswerStatus = AnswerResult.Waiting;
            }
        }
        
        public int PlayersStillToAnswer()
        {
            var numLeftToAnswer = 0;
            
            foreach (Player player in _players.Values)
            {
                if (player.IsConnected() && player.WaitingForNextSession==false)
                {
                    if (player.AnswerStatus == AnswerResult.Waiting)
                    {
                        numLeftToAnswer++;
                    }
                }
            }

            return numLeftToAnswer;
        }
        
        public void ActivateConnectedPlayers()
        {
            foreach (Player player in _players.Values)
            {
                if (player.IsConnected())
                {
                    _players[player.PlayerId].WaitingForNextSession = false;
                }
            }
        }

        public void SendObjectToActivePlayers(MessageFromServer obj)
        {
            var activePlayers = GetActivePlayers();

            foreach (Player player in activePlayers)
            {
                player.SendObject(obj);
            }
        }   
        
        public void DisconnectAll()
        {
            foreach (Player player in _players.Values)
            {
                player.GetClient().Close();
            }
        }   
        
        public void SendObjectToConnectedPlayers(MessageFromServer obj)
        {
            var connectedPlayers = GetConnectedPlayers();

            foreach (Player player in connectedPlayers)
            {
                player.SendObject(obj);
            }
        }
    }
}