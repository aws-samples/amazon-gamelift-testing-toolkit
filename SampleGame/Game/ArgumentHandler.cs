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
        [Option('p', "port", Required = false, Default = 2222,
            HelpText = "Port to run on, defaults to 2222")]
        public int Port { get; set; }
    
        [Option('h', "host", Required = false, Default = "127.0.0.1",
            HelpText = "Hostname/IP for client to connect into, defaults to 127.0.0.1")]
        public string ServerHost { get; set; }
    
        [Option('u', "url", Required = false, Default = null,
            HelpText = "WebSockets URL for client to connect into")]
        public string WSUrl { get; set; }

        [Option('i', "identity-pool-id", Required = false, Default = null,
            HelpText = "Identity Pool Id for client to connect into")]
        public string IdentityPoolId { get; set; }

        [Option('r', "identity-pool-region", Required = false, Default = null,
            HelpText = "Identity Pool Region for client to connect into")]
        public string IdentityPoolRegion { get; set; }
        
        [Option('t', "type", Required = false, Default = "server",
            HelpText = "server | client, defaults to server")]
        public string Type { get; set; }
    
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