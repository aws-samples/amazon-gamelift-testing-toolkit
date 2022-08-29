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
        private static string[] GameClientArguments = new string[]{"/local/game/bin/SampleGameBuild.csproj/net5.0/linux-x64/SampleGameBuild","--type", "client", "-u", "wss://qpl45ulh80.execute-api.eu-west-1.amazonaws.com/prod"};
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
                OperatingSystem = GameLiftBuildOs.AmazonLinux2, 
                Version = "0.01",
            };

            var backendStack = new BackendStack(this, "BackendStack", new BackendStackProps
            {
                GameLiftBuildProps = gameLiftBuildProps,
            });

            var virtualPlayersStack = new VirtualPlayersStack(this, "VirtualPlayerStack", new VirtualPlayersStackProps
            {
                VirtualPlayersConfiguration = virtualPlayersConfig,
                WebSocketApiUrl = backendStack.WebSocketStage.Url,
                IdentityPoolId = backendStack.GameIdentityPool.IdentityPoolId,
                IdentityPoolRegion = backendStack.Region,
            });

            // add VirtualPlayers tag to VirtualPlayersStack resources to allow toolkit to launch task definitions
            Tags.Of(virtualPlayersStack).Add("VirtualPlayers", "true");
        }
    }
}