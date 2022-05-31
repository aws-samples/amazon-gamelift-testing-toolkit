// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Amazon.ApiGatewayManagementApi;
using Amazon.ApiGatewayManagementApi.Model;
using Amazon.Lambda.Core;
using Newtonsoft.Json;

namespace SampleGameBackend.Common
{
    public static class Utils
    {
        /// <summary>JSON encodes an object and sends it to an APIGW connectionId and service URL.
        /// Returns false if the connection has gone away</summary>
        ///
        public static async Task<bool> SendJsonResponse(string connectionId, string serviceUrl, object obj )
        {
            var apiClient = new AmazonApiGatewayManagementApiClient(new AmazonApiGatewayManagementApiConfig {
                ServiceURL = serviceUrl
            });
            string message = JsonConvert.SerializeObject(obj);
            LambdaLogger.Log($"MESSAGE DESTINATION: {connectionId}");
            LambdaLogger.Log($"MESSAGE SERVICE URL: {serviceUrl}");
            LambdaLogger.Log($"MESSAGE CONTENTS: {message}");
            LambdaLogger.Log($"MESSAGE CONTENTS LENGTH: {message.Length}");
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
                return true;
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
        
        /// <summary>Returns a UNIX timestamp</summary>
        public static long GetUnixTimestamp()
        {
            var timeSpan = (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0));
            return (long)timeSpan.TotalSeconds;
        }
    }
}