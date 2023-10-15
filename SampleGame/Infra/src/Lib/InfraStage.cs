// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.StepFunctions;
using Constructs;
using TestGame.CDK.Constructs;

namespace SampleGameInfra.Lib
{
    public class InfraStageProps : StageProps
    {
        
    }
    public class InfraStage : Stage
    {
        
        // Update with arguments for running game client
        private static string[] GameClientArguments = new string[]{"/local/game/bin/SampleGameBuild.csproj/net6.0/linux-x64/SampleGameBuild","--type", "client" };
        internal InfraStage(Construct scope, string id, InfraStageProps props = null) : base(scope, id, props)
        {
            var virtualPlayersConfig = new VirtualPlayersConfiguration
            {
                DockerFileDirectory = "../Game/",
                VirtualClientArguments = GameClientArguments
            };
            
            var gameLiftBuildProps = new GameLiftBuildProps
            {
                AssetPath = "../Game/", 
                Name = "Sample Game Build",
                Version = "0.01",
                ServerSdkVersion = "5.1.1",
                OperatingSystem = GameLiftBuildOs.AmazonLinux2023,
            };

            if (scope.Node.GetContext("os").ToString() == "windows2016")
            {
                gameLiftBuildProps.OperatingSystem = GameLiftBuildOs.Windows2016;
            }

            if (scope.Node.GetContext("os").ToString() == "al2023")
            {
                gameLiftBuildProps.OperatingSystem = GameLiftBuildOs.AmazonLinux2023;
            }

            var apiGwLogsStack = new ApiGwLogsStack(this, "ApiGwLogsStack");

            var backendStack = new BackendStack(this, "BackendStack", new BackendStackProps
            {
                GameLiftBuildProps = gameLiftBuildProps,
                Description = "GameLift Testing Toolkit - Sample Game Backend infrastructure"
            });
            
            backendStack.AddDependency(apiGwLogsStack);

            var virtualPlayersStack = new VirtualPlayersStack(this, "VirtualPlayerStack", new VirtualPlayersStackProps
            {
                VirtualPlayersConfiguration = virtualPlayersConfig,
                WebSocketApiUrl = backendStack.WebSocketStage.Url,
                IdentityPoolId = backendStack.GameIdentityPool.IdentityPoolId,
                IdentityPoolRegion = backendStack.Region,
                Description = "GameLift Testing Toolkit - Sample Game Virtual player infrastructure"
            });

            // add VirtualPlayers tag to VirtualPlayersStack resources to allow toolkit to launch task definitions
            Tags.Of(virtualPlayersStack).Add("AmazonGameLiftTestingToolkit-VirtualPlayers", "true");
        }
    }
}