// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.Apigatewayv2;
using Amazon.CDK.AWS.Apigatewayv2.Alpha;
using Amazon.CDK.AWS.Apigatewayv2.Integrations.Alpha;
using Amazon.CDK.AWS.Cognito;
using Amazon.CDK.AWS.Cognito.IdentityPool.Alpha;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.IAM;
using Lambda = Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.Logs;
using Cdklabs.CdkNag;
using Constructs;
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
        public IdentityPool GameIdentityPool;

        public static string ProjectRoot = "../Backend";
        public static string CodeRoot = ProjectRoot + "/bin/Release/net6.0";
        
        internal BackendStack(Construct scope, string id, BackendStackProps props) : base(scope, id, props)
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
            var build = new GameLiftBuild(this, "SampleGameGameLiftBuild", props.GameLiftBuildProps);
            var instanceRole = new Role(this, "GameLiftInstanceRole", new RoleProps
            {
                AssumedBy = new CompositePrincipal(new PrincipalBase[ ] { 
                    new ServicePrincipal("gamelift.amazonaws.com"),   // required
                    new AccountPrincipal(this.Account),   // allow account to assume role for testing
                })
            });
            instanceRole.AddToPrincipalPolicy(DefaultCloudwatchPolicy);
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(instanceRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);
            var fleet = CreateFleet(build, "OnDemand", new GameLift.CfnFleetProps
            {
                Name = "Sample Game OnDemand Fleet",
                BuildId = build.BuildId,
                Ec2InstanceType = "c4.large",
                FleetType = "ON_DEMAND", 
                MaxSize = 0, // these values can only be changed after deployment
                DesiredEc2Instances = 0,
                MinSize = 0,
                InstanceRoleArn = instanceRole.RoleArn,
            }, 10);
            
            var alias = CreateAlias( "SampleGameOnDemandAlias", fleet);
            
            var spotFleet = CreateFleet(build, "Spot", new GameLift.CfnFleetProps
            {
                Name = "Sample Game Spot Fleet",
                BuildId = build.BuildId,
                Ec2InstanceType = "c4.large",
                FleetType = "SPOT", 
                MaxSize = 0, // these values can only be changed after deployment
                DesiredEc2Instances = 0,
                MinSize = 0,
                InstanceRoleArn = instanceRole.RoleArn,
            }, 10);
            
            var spotAlias = CreateAlias( "SampleGameSpotAlias", spotFleet);
            var aliases = new[] {spotAlias, alias};
            var queue = CreateGameSessionQueue(aliases);
            MatchConfig = CreateMatchmakingConfiguration( "SampleGame-MatchmakingConfig", queue);

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
                Code = Lambda.Code.FromAsset(CodeRoot),
                Handler = "SampleGameBackend::SampleGameBackend.GameClientService.GameClientService::GameClientServiceHandler",
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
                Code = Lambda.Code.FromAsset(CodeRoot),
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
            
            var gameClientServiceFunctionArn = GameClientServiceFunction.FunctionArn;
            var gameClientServiceApi = $"2015-03-31/functions/{gameClientServiceFunctionArn}/invocations";
            var integrationUri = $"arn:aws:apigateway:{this.Region}:lambda:path/{gameClientServiceApi}";
            
            WebSocketApi = new WebSocketApi(this, "GCSAPIGW", new WebSocketApiProps
            {
                ApiName = "GameClientServiceApi",
                DefaultRouteOptions = new WebSocketRouteOptions
                {
                    Integration = new WebSocketLambdaIntegration("GameClientServiceIntegration", GameClientServiceFunction),
                },
                RouteSelectionExpression = "$request.body.Type"
            });

            var connectIntegration = new CfnIntegration(this, "WebSocketConnectIntegration", new CfnIntegrationProps
            {
                ApiId = WebSocketApi.ApiId,
                IntegrationType = "AWS_PROXY",
                IntegrationUri = integrationUri,
            });

            var connectRoute = new CfnRoute(this, "WebSocketConnectRoute", new CfnRouteProps
            {
                ApiId = WebSocketApi.ApiId,
                AuthorizationType = "AWS_IAM",
                RouteKey = "$connect",
                Target = "integrations/" + connectIntegration.Ref
            });

            WebSocketStage = new WebSocketStage(this, "GCSAPIGW-Stage", new WebSocketStageProps
            {
                StageName = "prod",
                WebSocketApi = WebSocketApi,
                AutoDeploy = true
            });
            
            GameIdentityPool = new IdentityPool(this, "SampleGameIdentityPool", new IdentityPoolProps
            {
                AllowUnauthenticatedIdentities = true,
            });
            
            GameIdentityPool.UnauthenticatedRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[]
                {
                    $"arn:aws:execute-api:{this.Region}:*:{WebSocketStage.Api.ApiId}/{WebSocketStage.StageName}/*"
                },
                Actions = new[]
                {
                    "execute-api:Invoke"
                }
            }));
            
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(GameIdentityPool.UnauthenticatedRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to invoke API"
                }
            }, true);
            
            GameIdentityPool.AuthenticatedRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[]
                {
                    $"arn:aws:execute-api:{this.Region}:*:{WebSocketStage.Api.ApiId}/{WebSocketStage.StageName}/*"
                },
                Actions = new[]
                {
                    "execute-api:Invoke"
                }
            }));
            
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(GameIdentityPool.AuthenticatedRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to invoke API"
                }
            }, true);
            
            var cfnStage = WebSocketStage.Node.DefaultChild as CfnStage;
            cfnStage.AccessLogSettings = new CfnStage.AccessLogSettingsProperty
            {
                DestinationArn = gameApiLogGroup.LogGroupArn,
                Format = "{\"requestId\":\"$context.requestId\", \"ip\": \"$context.identity.sourceIp\", \"caller\":\"$context.identity.caller\", \"user\":\"$context.identity.user\",\"requestTime\":\"$context.requestTime\", \"eventType\":\"$context.eventType\",\"routeKey\":\"$context.routeKey\", \"status\":\"$context.status\",\"connectionId\":\"$context.connectionId\"}"
            };
            
            var apiGwInvokePolicy = new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[]
                {
                    $"arn:aws:execute-api:{this.Region}:*:{WebSocketStage.Api.ApiId}/{WebSocketStage.StageName}/*"
                },
                Actions = new[]
                {
                    "execute-api:Invoke"
                }
            });
            GameClientServiceFunction.Role.AddToPrincipalPolicy(apiGwInvokePolicy);
            GameClientServiceFunction.GrantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
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
                RetryAttempts = 3
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
                    LaunchPath = "/local/game/bin/SampleGameBuild.csproj/net6.0/linux-x64/SampleGameBuild",
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
                Name = "SampleGame-Queue",
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

            // ruleset body for 2 player game
            dynamic ruleSetBody2 = new
            {
                name="SimpleRuleSet-2Player", 
                ruleLanguageVersion="1.0", 
                teams=new dynamic[]
                {
                    new
                    {
                        name = "MyTeam", minPlayers = 2, maxPlayers = 2
                    }
                }
            };
            
            // ruleset body for 4 player game
            dynamic ruleSetBody4 = new
            {
                name="SimpleRuleSet-4Player", 
                ruleLanguageVersion="1.0", 
                teams=new dynamic[]
                {
                    new
                    {
                        name = "MyTeam", minPlayers = 4, maxPlayers = 4
                    }
                }
            };
            
            var ruleSet2Player = new GameLift.CfnMatchmakingRuleSet(this, mmConfigName + "-RuleSet2", new GameLift.CfnMatchmakingRuleSetProps
            {
                Name = "SimpleRuleSet-2Player",
                RuleSetBody = JsonConvert.SerializeObject(ruleSetBody2)
            });
            
            var ruleSet4Player = new GameLift.CfnMatchmakingRuleSet(this, mmConfigName + "-RuleSet4", new GameLift.CfnMatchmakingRuleSetProps
            {
                Name = "SimpleRuleSet-4Player",
                RuleSetBody = JsonConvert.SerializeObject(ruleSetBody4)
            });
            
            var ruleSetName = Fn.Ref(ruleSet2Player.LogicalId);
            new CfnOutput(this, "ruleSetName", new CfnOutputProps { Value = ruleSetName });

            var matchConfig = new GameLift.CfnMatchmakingConfiguration(this, "SampleGameMMConfig", new GameLift.CfnMatchmakingConfigurationProps
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

            matchConfig.AddDependsOn(ruleSet2Player);

            return matchConfig;
        }
    }
}