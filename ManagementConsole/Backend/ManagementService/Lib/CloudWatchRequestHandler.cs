// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.ManagementService.Data;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public class CloudWatchRequestHandler
    {
        private AmazonCloudWatchClient _client;
        public CloudWatchRequestHandler(AmazonCloudWatchClient client)
        {
            _client = client;
        }
        
        
        public async Task<ServerMessageGetCloudWatchLogs> GetCloudWatchLogs(string logGroup, string logStream)
        {
            var response = new ServerMessageGetCloudWatchLogs();
            
            var events = new List<OutputLogEvent>();
            var request = new GetLogEventsRequest
            {
                LogGroupName = logGroup,
                LogStreamName = logStream,
            };
            
            try
            {
                var logsClient = new AmazonCloudWatchLogsClient();
                var eventResponse = await logsClient.GetLogEventsAsync(request);
                response.LogEvents = eventResponse.Events;
                return response;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                response.ErrorMessage = e.Message;
                return response;
            }
        }

        public async Task<MemoryStream> GetWidgetImage(string metricWidgetJson)
        {
            try
            {
                var getCloudWatchGraphResponse = await _client.GetMetricWidgetImageAsync(
                    new GetMetricWidgetImageRequest
                    {
                        MetricWidget = metricWidgetJson,
                    });

                return getCloudWatchGraphResponse.MetricWidgetImage;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<Metric>> GetFleetMetrics(string fleetId)
        {
            var metricsPaginator = _client.Paginators.ListMetrics(new ListMetricsRequest
            {
                Namespace = "AWS/GameLift",
                Dimensions = new List<DimensionFilter>
                {
                    new DimensionFilter
                    {
                        Name = "FleetId",
                        Value = fleetId,
                    },
                }
            });
            
            try
            {
                var metrics = new List<Metric>();
                await foreach (var metric in metricsPaginator.Metrics)
                {
                    metrics.Add(metric);
                }

                return metrics;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<MetricDataResult>> GetFleetMetricData(string fleetId)
        {
            var metricDataQueries = new List<MetricDataQuery>
            {
                new MetricDataQuery
                {
                    MetricStat = new MetricStat
                    {
                        Metric = new Metric
                        {
                            Dimensions = new List<Dimension>
                            {
                                new Dimension
                                {
                                    Name = "FleetId",
                                    Value = fleetId,
                                }
                            },
                            MetricName = "AvailableGameSessions",
                            Namespace = "AWS/GameLift",
                        },
                        Period = 60,
                        Stat = "Average",
                    },
                    Id = "availableGameSessions",
                },
                new MetricDataQuery
                {
                    MetricStat = new MetricStat
                    {
                        Metric = new Metric
                        {
                            Dimensions = new List<Dimension>
                            {
                                new Dimension
                                {
                                    Name = "FleetId",
                                    Value = fleetId,
                                }
                            },
                            MetricName = "PercentAvailableGameSessions",
                            Namespace = "AWS/GameLift",
                        },
                        Period = 60,
                        Stat = "Average",
                    },
                    Id = "percentAvailableGameSessions",
                },
                new MetricDataQuery
                {
                    MetricStat = new MetricStat
                    {
                        Metric = new Metric
                        {
                            Dimensions = new List<Dimension>
                            {
                                new Dimension
                                {
                                    Name = "FleetId",
                                    Value = fleetId,
                                }
                            },
                            MetricName = "ActiveServerProcesses",
                            Namespace = "AWS/GameLift",
                        },
                        Period = 60,
                        Stat = "Average",
                    },
                    Id = "activeServerProcesses",
                },
            };

            return await GetLatestMetricData(metricDataQueries);
        }

        public async Task<List<MetricDataResult>> GetLatestMetricData(List<MetricDataQuery> metricDataQueries)
        {
            var metricDataResults = new List<MetricDataResult>();
            try
            {
                var metricDataPaginator = _client.Paginators.GetMetricData(new GetMetricDataRequest
                {
                    StartTimeUtc = DateTime.Now-TimeSpan.FromMinutes(5),
                    EndTimeUtc = DateTime.Now,
                    MetricDataQueries = metricDataQueries,
                });
                
                await foreach (var metricDataResult in metricDataPaginator.MetricDataResults)
                {
                    metricDataResults.Add(metricDataResult);
                }

                return metricDataResults;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
    }
}