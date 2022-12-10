// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Amazon.ApiGatewayManagementApi;
using Amazon.ApiGatewayManagementApi.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.ManagementService.Data;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.Common
{
    public static class Utils
    {
        /// <summary>JSON encodes an object and sends it to an APIGW connectionId and service URL.
        /// Returns false if the connection has gone away</summary>
        ///
        public static async Task<bool> SendJsonResponse(string connectionId, string serviceUrl, object obj, int maxMessageSize=30000 )
        {
            var apiClient = new AmazonApiGatewayManagementApiClient(new AmazonApiGatewayManagementApiConfig {
                ServiceURL = serviceUrl,
                ResignRetries = true,
            });
            
            var objectJson = JsonConvert.SerializeObject(obj);
            LambdaLogger.Log($"MESSAGE DESTINATION: {connectionId}");
            LambdaLogger.Log($"MESSAGE SERVICE URL: {serviceUrl}");
            LambdaLogger.Log($"MESSAGE CONTENTS: {objectJson}");
            LambdaLogger.Log($"MESSAGE CONTENTS LENGTH: {objectJson.Length}");
            var messages = new List<string>();
            if (objectJson.Length > maxMessageSize)
            {
                var multipartMessages = objectJson.MakeMultipartMessage(maxMessageSize);
                foreach (var multipartMessage in multipartMessages)
                {
                    messages.Add(JsonConvert.SerializeObject(multipartMessage));
                }
            }
            else
            {
                messages = new List<string>
                {
                    objectJson
                };
            }
            
            foreach (var message in messages)
            {
                var stream = new MemoryStream(UTF8Encoding.UTF8.GetBytes(message));
                var postConnectionRequest = new PostToConnectionRequest
                {
                    ConnectionId = connectionId,
                    Data = stream
                };
                try
                {
                    await apiClient.GetConnectionAsync(new GetConnectionRequest
                    {
                        ConnectionId = connectionId
                    });

                    await apiClient.PostToConnectionAsync(postConnectionRequest);
                    LambdaLogger.Log("SENT TO " + connectionId);
                }
                catch (GoneException e)
                {
                    LambdaLogger.Log(e.ToString());
                    return false;
                }
                catch (Exception e)
                {
                    LambdaLogger.Log(e.ToString());
                    return false;
                }
            }
            
            return true;
        }

        /// <summary>Returns a UNIX timestamp</summary>
        public static long GetUnixTimestamp()
        {
            var timeSpan = (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0));
            return (long)timeSpan.TotalSeconds;
        }
        
        private static Random rng = new Random();  

        public static void Shuffle<T>(this IList<T> list)  
        {  
            var n = list.Count;  
            while (n > 1) {  
                n--;  
                var k = rng.Next(n + 1);  
                var value = list[k];  
                list[k] = list[n];  
                list[n] = value;  
            }  
        }

        public static int RandomInt(int min, int max) 
        {   
            return rng.Next(min, max + 1);
        }

        public static int RandomInt(int max) 
        {
            return rng.Next(max + 1);
        }
        
        public static double RandomDouble(double min, double max) 
        {
            return (rng.NextDouble() * (max - min)) + min;
        }

        public static double RandomDouble(double max) 
        {
            return (rng.NextDouble() * max);
        }
        
        public static string ReadEventStream(Stream stream)
        {
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }

    }
}