// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections;
using System.Collections.Generic;
using CommandLine;
using CommandLine.Text;
using Newtonsoft.Json;

namespace SampleGameBuild
{
    public class Options {
        [Option('t', "type", Required = true,
            HelpText = "server | client")]
        public string Type { get; set; }
        
        [Option('p', "port", Required = false, Default = 2222,
            HelpText = "Port to run on when type=server, defaults to 2222")]
        public int Port { get; set; }
    
        [Option('h', "host", Required = false, Default = "127.0.0.1",
            HelpText = "Server Hostname/IP when type=client, defaults to 127.0.0.1")]
        public string ServerHost { get; set; }
    
        [Option('u', "url", Required = false, Default = null,
            HelpText = "GameServer API WebSocket URL when type=client")]
        public string WSUrl { get; set; }

        [Option('i', "identity-pool-id", Required = false, Default = null,
            HelpText = "Cognito Identity Pool Id when type=client")]
        public string IdentityPoolId { get; set; }

        [Option('r', "identity-pool-region", Required = false, Default = null,
            HelpText = "Cognito Identity Pool Region when type=client")]
        public string IdentityPoolRegion { get; set; }

        [Option('a', "anywhereAuthToken", Required = false, Default = null,
            HelpText = "GameLift Anywhere AuthToken when type=server")]
        public string AnywhereAuthToken { get; set; }
        
        [Option('f', "anywhereFleetId", Required = false, Default = null,
            HelpText = "GameLift Anywhere FleetId when type=server")]
        public string AnywhereFleetId { get; set; }
        
        [Option('s', "anywhereSdkEndpointUrl", Required = false, Default = null,
            HelpText = "GameLift Anywhere Fleet Endpoint Url when type=server")]
        public string AnywhereWebSocketUrl { get; set; }
        
        [Option('d', "anywhereHostId", Required = false, Default = null,
            HelpText = "GameLift Anywhere HostId when type=server")]
        public string AnywhereHostId { get; set; }
        
        [Option('l', "logFilePath", Required = false, Default = "/tmp/",
            HelpText = "Path where server logs should be written")]
        public string LogFilePath { get; set; }
    
    }

    public static class ArgumentHandler
    {
        public static void ProcessArgs(string[] args, Action<Options> callback)
        {
            var parser = new Parser(with =>
            {
                with.HelpWriter = null;
                with.EnableDashDash = true;
            });

            ParserResult<Options> result;
            //Console.WriteLine(args);

            result = parser.ParseArguments<Options>(args);
        
            var helpText = HelpText.AutoBuild(result, h =>
            {
                //configure HelpText
                h.AdditionalNewLineAfterOption = false;
                h.Heading = "NumbersQuiz v0.1"; 
                h.Copyright = ""; 
                h.AutoVersion = false;
                return h;
            }, e => e);
        
            //Console.WriteLine(result);

            result
                .WithParsed<Options>(options => callback(options))
                .WithNotParsed(errs =>
                {
                    Console.Write(helpText);
                    System.Environment.Exit(102);
                });
        }
    }

}