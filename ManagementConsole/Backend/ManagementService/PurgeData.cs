// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService;

public class PurgeDataRequest
{
    public string ConnectionId;
    public ClientMessagePurgeData PurgeRequest;
}
    
public class PurgeData
{
    /// <summary>
    /// Delete database items
    /// </summary>
    public async Task<bool> PurgeDataHandler(Stream stream, ILambdaContext context)
    {
        var eventStr = Utils.ReadEventStream(stream);
        LambdaLogger.Log(eventStr);

        var stageServiceUrl = Environment.GetEnvironmentVariable("StageServiceUrl");
        var request = JsonConvert.DeserializeObject<PurgeDataRequest>(eventStr);
            
        LambdaLogger.Log(JsonConvert.SerializeObject(request));

        var dynamoDbRequestHandler = new DynamoDbRequestHandler(new AmazonDynamoDBClient());

        var itemsPurged = 0;

        if (request.PurgeRequest.PurgeMatchmakingData)
        {
            itemsPurged += await dynamoDbRequestHandler.PurgeTable(Environment.GetEnvironmentVariable("TicketLogTableName"));
            await Utils.SendJsonResponse(request.ConnectionId, stageServiceUrl, new ServerMessagePurgeDataProgress { ItemsPurged = itemsPurged });
             
            itemsPurged += await dynamoDbRequestHandler.PurgeTable(Environment.GetEnvironmentVariable("MatchLogTableName"));
            await Utils.SendJsonResponse(request.ConnectionId, stageServiceUrl, new ServerMessagePurgeDataProgress { ItemsPurged = itemsPurged });

            itemsPurged += await dynamoDbRequestHandler.PurgeTable(Environment.GetEnvironmentVariable("EventLogTableName"));
            await Utils.SendJsonResponse(request.ConnectionId, stageServiceUrl, new ServerMessagePurgeDataProgress { ItemsPurged = itemsPurged });
        }

        if (request.PurgeRequest.PurgeGameSessionsData)
        {
            itemsPurged += await dynamoDbRequestHandler.PurgeTable(Environment.GetEnvironmentVariable("GameSessionTableName"));
            await Utils.SendJsonResponse(request.ConnectionId, stageServiceUrl, new ServerMessagePurgeDataProgress { ItemsPurged = itemsPurged });
        }
            
        await Utils.SendJsonResponse(request.ConnectionId, stageServiceUrl, new ServerMessagePurgeData { RequestSubmitted = true, Completed = true, ItemsPurged = itemsPurged});

        return false;
    }
}