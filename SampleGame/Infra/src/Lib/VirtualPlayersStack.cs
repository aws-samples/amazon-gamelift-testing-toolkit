// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Ecr.Assets;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.Logs;

namespace SampleGameInfra.Lib
{
    public struct VirtualPlayersStackProps
    {
        public string WebSocketApiUrl;
        public VirtualPlayersConfiguration VirtualPlayersConfiguration;
    }

    public struct VirtualPlayersConfiguration
    {
        public string DockerFileDirectory;
        public string[] VirtualClientArguments;
    }
    
    public class VirtualPlayersStack : Stack
    {   
        internal VirtualPlayersStack(Construct scope, string id, VirtualPlayersStackProps props) : base(scope, id)
        {
            var gameClientCommand = new string[] {"/local/game/bin/SampleGameBuild.csproj/net5.0/linux-x64/SampleGameBuild","--type","client","-u",props.WebSocketApiUrl};

            var executionRole = new Role(this, "FargateExecutionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("ecs-tasks.amazonaws.com")
            });
            
            executionRole.AddManagedPolicy(ManagedPolicy.FromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"));
            
            var taskRole = new Role(this, "FargateTaskRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("ecs-tasks.amazonaws.com")
            });

            var asset = new DockerImageAsset(this, "VirtualPlayersImage", new DockerImageAssetProps
            {
                Directory = props.VirtualPlayersConfiguration.DockerFileDirectory,
            });
            
            asset.Repository.GrantPull(executionRole);

            var containerImage = ContainerImage.FromDockerImageAsset(asset);

            var taskDefinition = new FargateTaskDefinition(this, "TaskDefinition",
                new FargateTaskDefinitionProps
                {
                    Cpu = 1024,
                    MemoryLimitMiB = 2048,
                    ExecutionRole = executionRole,
                    TaskRole = taskRole,
                });

            var containerLogGroup = new LogGroup(this, "LogGroup", new Amazon.CDK.AWS.Logs.LogGroupProps());
            var logGroupTarget = new CloudWatchLogGroup(containerLogGroup);
            
            taskDefinition.AddContainer("VirtualPlayerContainer", new ContainerDefinitionOptions
            {
                Image = containerImage,
                Logging = new AwsLogDriver(new AwsLogDriverProps
                {
                    StreamPrefix = "VirtualPlayers",
                    LogGroup = containerLogGroup,
                }),
                Command = gameClientCommand
            });
        }
    }
}