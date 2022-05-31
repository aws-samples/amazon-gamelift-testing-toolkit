// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;

namespace SampleGameBuild
{
    class Program
    {
        static void Main(string[] args)
        {
            //Console.SetOut(new StreamWriter("/tmp/serverOut.txt"));
            //Console.SetError(new StreamWriter("/tmp/serverErr.txt"));
            ArgumentHandler.ProcessArgs(System.Environment.GetCommandLineArgs(), Launch);
        }

        static void Launch(Options options)
        {
            var game = new Game(options);
            game.StartLoop();

            Console.WriteLine("done");
        }
    }
}