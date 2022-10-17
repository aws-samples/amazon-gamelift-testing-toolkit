// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Amazon.SecurityToken.Model;
using Amazon.SecurityToken;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using log4net;
using log4net.Config;
using log4net.Repository.Hierarchy;
using Newtonsoft.Json;

namespace SampleGameBuild.NumbersQuiz.Server
{
    public static class GameLogger
    {
        private static AmazonCloudWatchLogsClient _logsClient;
        private static string _logGroupName;
        private static string _logStreamName;
        private static bool _cloudWatchEnabled = false;
        private static readonly ILog Log4NetLogger = LogManager.GetLogger(typeof(Logger));

        static GameLogger()
        {
            //XmlConfigurator.Configure(new System.IO.FileInfo(Directory.GetCurrentDirectory() + "/log4net.config"));
        }
        
        public static string LogFilePath
        {
            set
            {
                Console.WriteLine("Setting LogFilePath to " + value);
                Console.SetOut(new StreamWriter(value)
                {
                    AutoFlush = true
                });
                Console.SetError(new StreamWriter(value)
                {
                    AutoFlush = true
                });

                /*
                var h = (log4net.Repository.Hierarchy.Hierarchy) LogManager.GetRepository();
                foreach (var a in h.Root.Appenders)
                {
                    if (a is log4net.Appender.FileAppender)
                    {
                            log4net.Appender.FileAppender fa = (log4net.Appender.FileAppender) a;                    
                            string logFileLocation = value;
                            fa.File = logFileLocation;              
                            fa.ActivateOptions();
                    }
                }
                */
            }
        }
        
        public async static Task EnableCloudWatch(Credentials credentials, string logGroupName, string logStreamName)
        {
            _logsClient = new AmazonCloudWatchLogsClient(credentials);
            _logGroupName = logGroupName;
            _logStreamName = logStreamName;
            
            try
            {
                await _logsClient.CreateLogGroupAsync(new CreateLogGroupRequest
                {
                    LogGroupName = _logGroupName
                });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            try
            {
                await _logsClient.CreateLogStreamAsync(new CreateLogStreamRequest
                {
                    LogGroupName = _logGroupName,
                    LogStreamName = _logStreamName
                });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            _cloudWatchEnabled = true;
        }
        
        public static void Log(string logStr)
        {
            //Log4NetLogger.Info(logStr);

            if (!_cloudWatchEnabled)
            {
                Console.WriteLine(logStr);
                return;
            }
            
            var inputLogEvent = new InputLogEvent
            {
                Message = logStr,
                Timestamp = DateTime.Now
            };
            
            Task.Run(async () =>
            {
                try
                {
                    await _logsClient.PutLogEventsAsync(new PutLogEventsRequest
                    {
                        LogGroupName = _logGroupName,
                        LogStreamName = _logStreamName,
                        LogEvents = new List<InputLogEvent> {inputLogEvent}
                    });
                }
                catch (InvalidSequenceTokenException e)
                {
                    await _logsClient.PutLogEventsAsync(new PutLogEventsRequest
                    {
                        LogGroupName = _logGroupName,
                        LogStreamName = _logStreamName,
                        LogEvents = new List<InputLogEvent> {inputLogEvent},
                        SequenceToken = e.ExpectedSequenceToken
                    });
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.ToString());
                    Log4NetLogger.Info(e.ToString());
                }
            });
  
        }
    }
}