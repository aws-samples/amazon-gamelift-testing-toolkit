// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGatewayv2;
using Amazon.CDK.AWS.APIGatewayv2.Integrations;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.IAM;
using Lambda = Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.Logs;
using Cdklabs.CdkNag;
using Newtonsoft.Json;
using GameLift = Amazon.CDK.AWS.GameLift;
using TestGame.CDK.Constructs;
using Attribute = Amazon.CDK.AWS.DynamoDB.Attribute;

namespace SampleGameInfra.Lib
{
    public class BackendStackProps : StackProps
    {
        public GameLiftBuildProps GameLiftBuildProps;
    }

    public class BackendStack : Stack
    {   
        public Table TicketsTable;
        public PolicyStatement DefaultCloudwatchPolicy;
        public GameLift.CfnMatchmakingConfiguration MatchConfig;
        public WebSocketApi WebSocketApi;
        public WebSocketStage WebSocketStage;
        public Lambda.Function GameClientServiceFunction;
        public Lambda.Function FlexMatchEventFunction;

        public static string ProjectRoot = "../Backend";
        
        internal BackendStack(Construct scope, string id, BackendStackProps props) : base(scope, id)
        {    
            // Create default Lambda policy
            DefaultCloudwatchPolicy = new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[] {"*"},
                Actions = new[]
                {
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                }
            });
            var build = new GameLiftBuild(this, "GameLiftBuild", props.GameLiftBuildProps);
            var instanceRole = new Role(this, "GameLiftInstanceRole", new RoleProps
            {
                AssumedBy = new CompositePrincipal(new PrincipalBase[ ] { 
                    new ServicePrincipal("gamelift.amazonaws.com"),   // required
                    new AccountPrincipal(this.Account),   // allow account to assume role for testing
                })
            });
            instanceRole.AddToPrincipalPolicy(DefaultCloudwatchPolicy);
            var fleet = CreateFleet(build, "OnDemand", new GameLift.CfnFleetProps
            {
                Name = "OnDemandFleet",
                BuildId = build.BuildId,
                Ec2InstanceType = "c4.large",
                FleetType = "ON_DEMAND", 
                MaxSize = 1, // these values can only be changed after deployment
                DesiredEc2Instances = 1,
                MinSize = 1,
                InstanceRoleArn = instanceRole.RoleArn,
            }, 5);
            
            var alias = CreateAlias( "OnDemandAlias", fleet);
            
            var spotFleet = CreateFleet(build, "Spot", new GameLift.CfnFleetProps
            {
                Name = "SpotFleet",
                BuildId = build.BuildId,
                Ec2InstanceType = "c4.large",
                FleetType = "SPOT", 
                MaxSize = 1, // these values can only be changed after deployment
                DesiredEc2Instances = 1,
                MinSize = 1,
                InstanceRoleArn = instanceRole.RoleArn,
            }, 5);
            
            var spotAlias = CreateAlias( "SpotAlias", spotFleet);
            var aliases = new[] {spotAlias, alias};
            var queue = CreateGameSessionQueue(aliases);
            MatchConfig = CreateMatchmakingConfiguration( "MatchmakingConfig", queue);

            CreateTables();
            CreateLambdas(); 
            CreateWebSocketApi();
            CreateFlexMatchRule();
            
            var serviceUrl = WebSocketStage.Url.Replace("wss://", "https://");

            WebSocketStage.GrantManagementApiAccess(GameClientServiceFunction);
            WebSocketStage.GrantManagementApiAccess(FlexMatchEventFunction);

            GameClientServiceFunction.AddEnvironment("StageServiceUrl", serviceUrl);
            FlexMatchEventFunction.AddEnvironment("StageServiceUrl", serviceUrl);
            
            new CfnOutput(this, "gcsApiUrl", new CfnOutputProps { Value = WebSocketStage.Url });
        }

        private void CreateTables()
        {
            TicketsTable = new Table(this, "MMTicketsTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "TicketId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });
            
            TicketsTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "MatchId-GSI",
                PartitionKey = new Attribute
                {
                    Name = "MatchId",
                    Type = AttributeType.STRING
                }
            });
            
            new CfnOutput(this, "mmTicketsTableName", new CfnOutputProps { Value = TicketsTable.TableName });
            new CfnOutput(this, "mmTicketsTableArn", new CfnOutputProps { Value = TicketsTable.TableArn });
        }
        
        private void CreateLambdas()
        {
            // The code that defines your stack goes here
            var gameClientServiceFunctionRole = new Role(this, "GameClientServiceFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            gameClientServiceFunctionRole.AddToPrincipalPolicy(DefaultCloudwatchPolicy);
            GameClientServiceFunction = new Lambda.Function(this, "GCSServiceLambdaFunction", new Lambda.FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Lambda.Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "SampleGameBackend::SampleGameBackend.GameClientService.GameClientService::GameClientServiceHandler",
                //foo
                Environment = new Dictionary<string, string>
                {
                    ["MatchmakingTicketsTableName"] = TicketsTable.TableName,
                    ["MatchmakingConfigurationName"] = MatchConfig.Name
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = gameClientServiceFunctionRole
            });
            gameClientServiceFunctionRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[] {"*"},
                Actions = new[]
                {
                    "gamelift:StartMatchmaking",
                }
            }));
            TicketsTable.GrantReadWriteData(GameClientServiceFunction);
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(gameClientServiceFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch and GameLift generic components"
                }
            }, true);
            
            var flexMatchEventFunctionRole = new Role(this, "FlexMatchEventFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            flexMatchEventFunctionRole.AddToPrincipalPolicy(DefaultCloudwatchPolicy);
            FlexMatchEventFunction = new Lambda.Function(this, "GCSFlexMatchEventLambdaFunction", new Lambda.FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Lambda.Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "SampleGameBackend::SampleGameBackend.GameClientService.GameClientService::FlexMatchEventHandler",
                Environment = new Dictionary<string, string>
                {
                    ["MatchmakingTicketsTableName"] = TicketsTable.TableName,
                    ["MatchmakingConfigurationName"] = MatchConfig.Name
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = flexMatchEventFunctionRole
            });
            TicketsTable.GrantReadWriteData(FlexMatchEventFunction);
            
            // Adding specific CDK-Nag Suppression
            NagSuppressions.AddResourceSuppressions(flexMatchEventFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch generic components"
                }
            }, true);
        }
        
        private void CreateWebSocketApi()
        {
            var gameApiLogGroup = new LogGroup(this, "TestGameAPIGWLogGroup", new Amazon.CDK.AWS.Logs.LogGroupProps());
            var logGroupTarget = new CloudWatchLogGroup(gameApiLogGroup);
            
            WebSocketApi = new WebSocketApi(this, "GCSAPIGW", new WebSocketApiProps
            {
                ApiName = "GameClientServiceApi",
                DefaultRouteOptions = new WebSocketRouteOptions
                {
                    Integration = new WebSocketLambdaIntegration("GameClientServiceIntegration", GameClientServiceFunction)
                },
                RouteSelectionExpression = "$request.body.Type"
            });

            WebSocketStage = new WebSocketStage(this, "GCSAPIGW-Stage", new WebSocketStageProps
            {
                StageName = "prod",
                WebSocketApi = WebSocketApi,
                AutoDeploy = true
            });
            
            var cfnStage = WebSocketStage.Node.DefaultChild as CfnStage;
            cfnStage.AccessLogSettings = new CfnStage.AccessLogSettingsProperty
            {
                DestinationArn = gameApiLogGroup.LogGroupArn,
                Format = "{\"requestId\":\"$context.requestId\", \"ip\": \"$context.identity.sourceIp\", \"caller\":\"$context.identity.caller\", \"user\":\"$context.identity.user\",\"requestTime\":\"$context.requestTime\", \"eventType\":\"$context.eventType\",\"routeKey\":\"$context.routeKey\", \"status\":\"$context.status\",\"connectionId\":\"$context.connectionId\"}"
            };

        }

        private void CreateFlexMatchRule()
        {
            var flexMatchEventRule = new Rule(this, "FlexMatchEventRule", new RuleProps
            {
                EventPattern = new EventPattern
                {
                    Source = new[] {"aws.gamelift"},
                    DetailType = new[] {"GameLift Matchmaking Event"}
                }
            });
            
            flexMatchEventRule.AddTarget(new LambdaFunction(FlexMatchEventFunction, new LambdaFunctionProps
            {
                MaxEventAge = Duration.Hours(1),
                RetryAttempts = 2
            }));
        }

        internal GameLift.CfnFleet CreateFleet(GameLiftBuild build, string fleetName, GameLift.CfnFleetProps fleetProps, int numProcesses=1 )
        {
            var processProperties = new List<GameLift.CfnFleet.ServerProcessProperty>();
            var inboundPermissionProperties = new List<GameLift.CfnFleet.IpPermissionProperty>();
            for (int port = 1935; port < 1935+numProcesses; port++)
            {
                processProperties.Add(new GameLift.CfnFleet.ServerProcessProperty
                {
                    ConcurrentExecutions = 1,
                    LaunchPath = "/local/game/bin/SampleGameBuild.csproj/net5.0/linux-x64/SampleGameBuild",
                    Parameters = "--type server --port " + port,
                });
                
                inboundPermissionProperties.Add(new GameLift.CfnFleet.IpPermissionProperty
                {
                    FromPort = port,
                    ToPort = port,
                    Protocol = "TCP",
                    IpRange = "0.0.0.0/0"
                });
            }

            fleetProps.RuntimeConfiguration = new GameLift.CfnFleet.RuntimeConfigurationProperty
            {
                GameSessionActivationTimeoutSeconds = 300,
                MaxConcurrentGameSessionActivations = 1,
                ServerProcesses = processProperties.ToArray(),
            };

            fleetProps.Ec2InboundPermissions = inboundPermissionProperties.ToArray();


            var fleet = new GameLift.CfnFleet(this, fleetName, fleetProps);
            fleet.Node.AddDependency(build);

            var fleetId = Fn.Ref(fleet.LogicalId);
            var fleetArn = $"arn:aws:gamelift:{this.Region}:{this.Account}:fleet/{fleetId}";
            new CfnOutput(this, $"{fleetName}Id", new CfnOutputProps { Value = fleetId });
            new CfnOutput(this, $"{fleetName}Arn", new CfnOutputProps { Value = fleetArn });

            return fleet;
        }

        internal GameLift.CfnAlias CreateAlias(string aliasName, GameLift.CfnFleet fleet)
        {
            var alias = new GameLift.CfnAlias(this, aliasName, new GameLift.CfnAliasProps
            {
                Name = aliasName,
                Description = "My alias",
                RoutingStrategy = new GameLift.CfnAlias.RoutingStrategyProperty
                {
                    Type = "SIMPLE",
                    FleetId = Fn.Ref(fleet.LogicalId)
                }
            });
            
            var aliasId = Fn.Ref(alias.LogicalId);
            var aliasArn = $"arn:aws:gamelift:{this.Region}:{this.Account}:alias/{aliasId}";
            
            new CfnOutput(this, $"{aliasName}Id", new CfnOutputProps { Value = aliasId });
            new CfnOutput(this, $"{aliasName}Arn", new CfnOutputProps { Value = aliasArn });

            return alias;
        }

        internal GameLift.CfnGameSessionQueue CreateGameSessionQueue(GameLift.CfnAlias[] aliases)
        {
            var destinations = new List<GameLift.CfnGameSessionQueue.DestinationProperty>();
            foreach (var alias in aliases)
            {
                var aliasId = Fn.Ref(alias.LogicalId);
                var aliasArn = $"arn:aws:gamelift:{this.Region}:{this.Account}:alias/{aliasId}";
                destinations.Add(new GameLift.CfnGameSessionQueue.DestinationProperty
                {
                    DestinationArn = aliasArn
                });
            }

            var queue = new GameLift.CfnGameSessionQueue(this, "Queue", new GameLift.CfnGameSessionQueueProps
            {
                Name = "NumbersQuiz-Queue",
                Destinations = destinations.ToArray(),
                TimeoutInSeconds = 60,
            });
            
            var queueName = Fn.Ref(queue.LogicalId);
            var queueArn = $"arn:aws:gamelift:{this.Region}:{this.Account}:gamesessionqueue/{queueName}";
            
            new CfnOutput(this, "queueName", new CfnOutputProps { Value = queueName });
            new CfnOutput(this, "queueArn", new CfnOutputProps { Value = queueArn });

            return queue;
        }

        internal GameLift.CfnMatchmakingConfiguration CreateMatchmakingConfiguration(string mmConfigName, GameLift.CfnGameSessionQueue queue)
        {
            var queueName = Fn.Ref(queue.LogicalId);
            var queueArn = $"arn:aws:gamelift:{this.Region}:{this.Account}:gamesessionqueue/{queueName}";
            
            var gameProperties = new List<GameLift.CfnMatchmakingConfiguration.GamePropertyProperty>();
            gameProperties.Add(new GameLift.CfnMatchmakingConfiguration.GamePropertyProperty
            {
                Key = "somekey",
                Value = "somevalue"
            });

            dynamic team = new {name = "MyTeam", minPlayers = 2, maxPlayers = 2};
            dynamic ruleSetBody = new {name="SimpleRuleSet", ruleLanguageVersion="1.0", teams=new dynamic[] {team}};
            
            var ruleSet = new GameLift.CfnMatchmakingRuleSet(this, mmConfigName + "-RuleSet", new GameLift.CfnMatchmakingRuleSetProps
            {
                Name = "SimpleRuleSet",
                RuleSetBody = JsonConvert.SerializeObject(ruleSetBody)
            });
            
            var ruleSetName = Fn.Ref(ruleSet.LogicalId);
            new CfnOutput(this, "ruleSetName", new CfnOutputProps { Value = ruleSetName });

            var matchConfig = new GameLift.CfnMatchmakingConfiguration(this, "MMConfig", new GameLift.CfnMatchmakingConfigurationProps
            {
                AcceptanceRequired = false,
                BackfillMode = "AUTOMATIC",
                Description = "Matchmaking config for Numbers Quiz",
                FlexMatchMode = "WITH_QUEUE",
                GameProperties = gameProperties.ToArray(),
                GameSessionData = "Somedata",
                GameSessionQueueArns = new string[] {queueArn},
                Name = mmConfigName,
                RequestTimeoutSeconds = 60,
                RuleSetName = ruleSetName
            });

            matchConfig.AddDependsOn(ruleSet);

            return matchConfig;
        }
    }
}