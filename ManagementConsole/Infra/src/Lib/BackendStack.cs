// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Apigatewayv2;
using Amazon.CDK.AWS.Apigatewayv2.Alpha;
using Amazon.CDK.AWS.Apigatewayv2.Integrations.Alpha;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.GameLift;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.KMS;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Logs;
using Amazon.CDK.AWS.StepFunctions;
using Amazon.CDK.AWS.StepFunctions.Tasks;
using Cdklabs.CdkNag;
using Constructs;
using Newtonsoft.Json;
using CfnRoute = Amazon.CDK.AWS.Apigatewayv2.CfnRoute;
using CfnRouteProps = Amazon.CDK.AWS.Apigatewayv2.CfnRouteProps;
using CfnStage = Amazon.CDK.AWS.Apigatewayv2.CfnStage;

namespace ManagementConsoleInfra.Lib
{
    public class BackendProps : StackProps
    {
        public Table ManagementConfigTable;
        public Table ManagementConnectionsTable;
        public Table EventLogTable;
        public Table GameSessionTable;
        public Table StateLogTable;
        public Table TicketLogTable;
        public Table PlayerProfileTable;
        public Table MatchmakingSimulationTable;
        public Table SimulationResultsTable;
        public Table SimulationPlayersTable;
        public Key EncryptionKey;
    }
    public class BackendStack : Stack
    {
        public PolicyStatement DefaultLambdaPolicy;
        public StateMachine StatePollerStateMachine;
        public Function SfnPollerFunction;
        public Function SfnRestartFunction;
        public Function ManagementServiceFunction;
        public Function StateEventHandlerFunction;
        public Function FlexMatchEventFunction;
        public Function QueuePlacementEventFunction;
        public Function ConfigPopulatorFunction;
        public Amazon.CDK.AWS.Events.EventBus GameEventBus;
        public WebSocketStage ProdStage;
        public CfnMatchmakingConfiguration FlexMatchSimulator;
        public Vpc VirtualPlayersRunnerVpc;
        public Cluster VirtualPlayersRunnerCluster;
        public SecurityGroup VirtualPlayersRunnerSecurityGroup;
        
        public static string ProjectRoot = "../Backend";
        
        internal BackendStack(Construct scope, string id, BackendProps props = null) : base(scope, id, props)
        {
            // Create default Lambda policy
            DefaultLambdaPolicy = new PolicyStatement(new PolicyStatementProps
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

            CreateFlexMatchSimulator(this);
            CreateStatePoller(this, props);
            CreateVirtualPlayersRunner(this);
            CreateLambdas(this, props);
            CreateWebSocketApi(this, props);
            CreateEventBus(this, props);

            var customResource = new CfnCustomResource(this, "ConfigPopulatorCustomResource", new CfnCustomResourceProps
            {
                ServiceToken = ConfigPopulatorFunction.FunctionArn,
            });
            
            
            NagSuppressions.AddResourceSuppressions(this, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress findings for default CDK Role and managed policy used to create this stack"
                },
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM4",
                    Reason = "Suppress finding for default CDK Role wildcard used to create this stack"
                }
            }, true);
        }

        internal void CreateWebSocketApi(Construct scope, BackendProps props)
        {
            // Configure Log role for ApiGateway
            var apigwLogRole = new Role(this, "apigwLogRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("apigateway.amazonaws.com")
            });
            apigwLogRole.AddManagedPolicy(ManagedPolicy.FromManagedPolicyArn(this, "ApiGwLogPolicy", "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"));
            
            var cfnAccount = new CfnAccount(this, "APIGWAccount", new CfnAccountProps
            {
                CloudWatchRoleArn = apigwLogRole.RoleArn
            });
            
            var webSocketApi = new WebSocketApi(this, "APIGW", new WebSocketApiProps
            {
                ApiName = "ManagementServiceApi",
                DefaultRouteOptions = new WebSocketRouteOptions
                {
                    Integration = new WebSocketLambdaIntegration("ManagementServiceIntegration", ManagementServiceFunction)
                },
                RouteSelectionExpression = "$request.body.Type"
            });
            webSocketApi.Node.AddDependency(cfnAccount);

            var mgmtServiceFunctionArn = ManagementServiceFunction.FunctionArn;
            var mgmtServiceApi = $"2015-03-31/functions/{mgmtServiceFunctionArn}/invocations";
            var integrationUri = $"arn:aws:apigateway:{this.Region}:lambda:path/{mgmtServiceApi}";

            var connectIntegration = new CfnIntegration(this, "WebSocketConnectIntegration", new CfnIntegrationProps
            {
                ApiId = webSocketApi.ApiId,
                IntegrationType = "AWS_PROXY",
                IntegrationUri = integrationUri,
            });

            var connectRoute = new CfnRoute(this, "WebSocketConnectRoute", new CfnRouteProps
            {
                ApiId = webSocketApi.ApiId,
                AuthorizationType = "AWS_IAM",
                RouteKey = "$connect",
                Target = "integrations/" + connectIntegration.Ref
            });

            ProdStage = new WebSocketStage(this, "APIGW-Stage", new WebSocketStageProps
            {
                StageName = "prod",
                WebSocketApi = webSocketApi,
                AutoDeploy = true,
            });

            var apiLogGroup = new LogGroup(this, "ManagementAPIGWLogGroup", new Amazon.CDK.AWS.Logs.LogGroupProps
            {
               EncryptionKey = props.EncryptionKey
            });
            var logGroupTarget = new CloudWatchLogGroup(apiLogGroup);

            var cfnStage = ProdStage.Node.DefaultChild as CfnStage;
            cfnStage.AccessLogSettings = new CfnStage.AccessLogSettingsProperty
            {
                DestinationArn = apiLogGroup.LogGroupArn,
                Format = "{\"requestId\":\"$context.requestId\", \"ip\": \"$context.identity.sourceIp\", \"caller\":\"$context.identity.caller\", \"user\":\"$context.identity.user\",\"requestTime\":\"$context.requestTime\", \"eventType\":\"$context.eventType\",\"routeKey\":\"$context.routeKey\", \"status\":\"$context.status\",\"connectionId\":\"$context.connectionId\"}"
            };

            var serviceUrl = ProdStage.Url.Replace("wss://", "https://");
            
            ManagementServiceFunction.AddEnvironment("StageServiceUrl", serviceUrl);
            StateEventHandlerFunction.AddEnvironment("StageServiceUrl", serviceUrl);
            QueuePlacementEventFunction.AddEnvironment("StageServiceUrl", serviceUrl);
            FlexMatchEventFunction.AddEnvironment("StageServiceUrl", serviceUrl);
            
            // Then add Function permission to access ApiGW
            ProdStage.GrantManagementApiAccess(ManagementServiceFunction);
            ProdStage.GrantManagementApiAccess(StateEventHandlerFunction);
            ProdStage.GrantManagementApiAccess(QueuePlacementEventFunction);
            ProdStage.GrantManagementApiAccess(FlexMatchEventFunction);
            
            var apiGwInvokePolicy = new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[]
                {
                    $"arn:aws:execute-api:{this.Region}:*:{ProdStage.Api.ApiId}/{ProdStage.StageName}/*"
                },
                Actions = new[]
                {
                    "execute-api:Invoke"
                }
            });
            ManagementServiceFunction.Role.AddToPrincipalPolicy(apiGwInvokePolicy);
            StateEventHandlerFunction.Role.AddToPrincipalPolicy(apiGwInvokePolicy);
            QueuePlacementEventFunction.Role.AddToPrincipalPolicy(apiGwInvokePolicy);
            FlexMatchEventFunction.Role.AddToPrincipalPolicy(apiGwInvokePolicy);

            // Adding permission for ApiGW to invoke Lambda functions
            ManagementServiceFunction.GrantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));

            new CfnOutput(this, "mgmtApiUrl",  new CfnOutputProps {
                Value = ProdStage.Url
            });
        }
        
        internal void CreateEventBus(Construct scope, BackendProps props)
        {
            GameEventBus = new Amazon.CDK.AWS.Events.EventBus(this, "MgmtEventBus", new Amazon.CDK.AWS.Events.EventBusProps
            {
                EventBusName = "ManagementEventBus"
            });

            
            var statePollEventRule = new Rule(this, "StatePollEventRule", new RuleProps
            {
                EventBus = GameEventBus,
                EventPattern = new EventPattern
                {
                    Source = new[] {"CustomGameLift"}
                }
            });
            var logGroup = new LogGroup(this, "CustomEventsLogGroup", new Amazon.CDK.AWS.Logs.LogGroupProps
            {
                EncryptionKey = props.EncryptionKey
            });
            var logGroupTarget = new CloudWatchLogGroup(logGroup);

            statePollEventRule.AddTarget(logGroupTarget);
            statePollEventRule.AddTarget(new LambdaFunction(StateEventHandlerFunction, new LambdaFunctionProps
            {
                MaxEventAge = Duration.Minutes(1),
                RetryAttempts = 0
            }));
            
            var flexMatchEventRule = new Rule(this, "FlexMatchEventRule", new RuleProps
            {
                EventPattern = new EventPattern
                {
                    Source = new[] {"aws.gamelift"},
                    DetailType = new[] {"GameLift Matchmaking Event"}
                }
            });
            
            flexMatchEventRule.AddTarget(new LambdaFunction(FlexMatchEventFunction,  new LambdaFunctionProps
            {
                MaxEventAge = Duration.Hours(1),
                RetryAttempts = 3
            }));

            var queuePlacementEventRule = new Rule(this, "QueuePlacementEventRule", new RuleProps
            {
                EventPattern = new EventPattern
                {
                    Source = new[] {"aws.gamelift"},
                    DetailType = new[] {"GameLift Queue Placement Event"}
                }
            });
            
            queuePlacementEventRule.AddTarget(new LambdaFunction(QueuePlacementEventFunction, new LambdaFunctionProps
            {
                MaxEventAge = Duration.Hours(1),
                RetryAttempts = 3
            }));
            
            GameEventBus.GrantPutEventsTo(SfnPollerFunction);
            SfnPollerFunction.AddEnvironment("EventBusName", GameEventBus.EventBusName);
        }

        private void CreateVirtualPlayersRunner(Construct scope)
        {
            
            VirtualPlayersRunnerVpc = new Vpc(this, "VirtualPlayersVpc", new VpcProps
            {
                MaxAzs = 2,
            });
            
            VirtualPlayersRunnerCluster = new Cluster(this, "VirtualPlayersCluster", new ClusterProps
            {
                Vpc = VirtualPlayersRunnerVpc,
            });

            VirtualPlayersRunnerSecurityGroup = new SecurityGroup(this, "VirtualPlayersSg", new SecurityGroupProps
            {
                AllowAllOutbound = true,
                Vpc = VirtualPlayersRunnerVpc,
            });
        }

        private void CreateStatePoller(Construct scope, BackendProps props)
        {
            var sfnPollerFunctionRole = new Role(this, "SfnPollerFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            sfnPollerFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            
            SfnPollerFunction = new Function(this, "SfnPollerLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.StepFunctions::StatePollHandler",
                Environment = new Dictionary<string, string>
                {
                    ["ConfigTableName"] = props.ManagementConfigTable.TableName,
                    ["StateLogTableName"] = props.StateLogTable.TableName,
                    ["GameSessionTableName"] = props.GameSessionTable.TableName,
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = sfnPollerFunctionRole
            });
            
            sfnPollerFunctionRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
                {
                    Effect = Effect.ALLOW,
                    Resources = new[] {"*"},
                    Actions = new[]
                    {
                        "gamelift:DescribeGameSessionQueues",
                        "gamelift:ListAliases",
                        "gamelift:DescribeMatchmakingConfigurations",
                        "gamelift:ListFleets",
                        "gamelift:DescribeFleetCapacity",
                        "gamelift:DescribeGameSessions",
                        "gamelift:DescribeFleetLocationAttributes",
                        "gamelift:DescribeFleetLocationCapacity",
                        "gamelift:DescribeInstances",
                        "gamelift:DescribeRuntimeConfiguration",
                        "gamelift:DescribeScalingPolicies",
                        "gamelift:DescribeFleetAttributes",
                        "gamelift:DescribeFleetEvents",
                        "gamelift:DescribeFleetUtilization"
                    }
                }));
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(sfnPollerFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access specific actions to whole GameLift components"
                }
            }, true);
            
            props.ManagementConfigTable.GrantReadData(SfnPollerFunction);
            props.StateLogTable.GrantReadWriteData(SfnPollerFunction);
            props.GameSessionTable.GrantWriteData(SfnPollerFunction);

            var sfnIteratorFunctionRole = new Role(this, "SfnIteratorFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            sfnIteratorFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            var sfnIteratorHandlerFunction = new Function(this, "SfnIteratorHandlerLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.StepFunctions::StepFunctionIteratorHandler",
                Timeout = Duration.Seconds(30),
                MemorySize = 128,
                Role = sfnIteratorFunctionRole
            });
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(sfnIteratorFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);

            var sfnRestartFunctionRole = new Role(this, "SfnRestartFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            sfnRestartFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            SfnRestartFunction = new Function(this, "SfnRestartHandlerLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.StepFunctions::StepFunctionRestartHandler",
                Timeout = Duration.Seconds(30),
                MemorySize = 128,
                Role = sfnRestartFunctionRole
            });
            sfnRestartFunctionRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[] {"*"},
                Actions = new[]
                {
                    "states:StartExecution"
                }
            }));
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(sfnRestartFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);

            var iteratorData = new Dictionary<string,object>
            {
                {"Count", 500},
                {"Step", 1},
                {"Index", -1}
            };
            var configureCount = new Pass(this, "ConfigureCount", new PassProps
            {
                Result = Result.FromObject(iteratorData),
                ResultPath = "$.Iterator"
            });

            var iteratorTask = new LambdaInvoke(this, "Iterator", new LambdaInvokeProps
            {
                LambdaFunction = sfnIteratorHandlerFunction,
                ResultPath = "$.Iterator",
                PayloadResponseOnly = true
            });
            

            var pollTask = new LambdaInvoke(this, "PollState", new LambdaInvokeProps
            {
                LambdaFunction = SfnPollerFunction,
                PayloadResponseOnly = true,
                ResultPath = "$.PollAgainData"
            });
            
            var restartTask = new LambdaInvoke(this, "RestartExecution", new LambdaInvokeProps
            {
                LambdaFunction = SfnRestartFunction,
                Payload = TaskInput.FromJsonPathAt("$$")
            });
            

            var shouldRestart = new Choice(this, "ShouldRestart");
            shouldRestart.When(Condition.BooleanEquals("$.Iterator.Continue", true), pollTask);

            var successState = new Succeed(this, "SuccessState");
            shouldRestart.Otherwise(restartTask);
            restartTask.Next(successState);
            
            var waitTask = new Wait(this, "WaitTask", new WaitProps
            {
                Time = WaitTime.SecondsPath("$.PollAgainData.PollFrequency")
            });
            
            var shouldPollAgain = new Choice(this, "ShouldPollAgain");
            shouldPollAgain.When(Condition.BooleanEquals("$.PollAgainData.PollAgain", false), successState);
            shouldPollAgain.When(Condition.BooleanEquals("$.PollAgainData.PollAgain", true), waitTask);

            configureCount.Next(iteratorTask);
            iteratorTask.Next(shouldRestart);
            
            waitTask.Next(iteratorTask);

            pollTask.Next(shouldPollAgain);

            StatePollerStateMachine = new StateMachine(this, "PollerStateMachine", new StateMachineProps
            {
                Definition = configureCount,
            });
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(StatePollerStateMachine, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);


            new CfnOutput(this, "statePollerStateMachineArn",  new CfnOutputProps {
                Value = StatePollerStateMachine.StateMachineArn
            });
        }
        
        private void CreateLambdas(Construct scope, BackendProps props) 
        {
            var subnetIds = new List<string>();
            foreach (var subnet in VirtualPlayersRunnerVpc.PrivateSubnets)
            {
                subnetIds.Add(subnet.SubnetId);
            }

            var managementServiceFunctionRole = new Role(this, "ManagementServiceFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            managementServiceFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            ManagementServiceFunction = new Function(this, "MgmtServiceLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.ManagementService::ManagementServiceHandler",
                Environment = new Dictionary<string, string>
                {
                    ["ConnectionsTableName"] = props.ManagementConnectionsTable.TableName,
                    ["EventLogTableName"] = props.EventLogTable.TableName,
                    ["MatchmakingSimulationTableName"] = props.MatchmakingSimulationTable.TableName,
                    ["PlayerProfileTableName"] = props.PlayerProfileTable.TableName,
                    ["TicketLogTableName"] = props.TicketLogTable.TableName,
                    ["SimulationResultsTableName"] = props.SimulationResultsTable.TableName,
                    ["SimulationPlayersTableName"] = props.SimulationPlayersTable.TableName,
                    ["GameSessionTableName"] = props.GameSessionTable.TableName,
                    ["StateLogTableName"] = props.StateLogTable.TableName,
                    ["ConfigTableName"] = props.ManagementConfigTable.TableName,
                    ["FlexMatchSimulatorArn"] = FlexMatchSimulator.AttrArn,
                    ["VirtualPlayersClusterArn"] = VirtualPlayersRunnerCluster.ClusterArn,
                    ["VirtualPlayersSecurityGroupId"] = VirtualPlayersRunnerSecurityGroup.SecurityGroupId,
                    ["VirtualPlayersSubnetIds"] = JsonConvert.SerializeObject(subnetIds),
                    ["StateMachineArn"] = StatePollerStateMachine.StateMachineArn
                },
                Timeout = Duration.Minutes(15),
                MemorySize = 1024,
                Role = managementServiceFunctionRole
            });
            StatePollerStateMachine.GrantStartExecution(ManagementServiceFunction);
            
            managementServiceFunctionRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
                {
                    Effect = Effect.ALLOW,
                    Resources = new[] {"*"},
                    Actions = new[]
                    {
                        "ecs:ListTaskDefinitions",
                        "ecs:ListTagsForResource",
                        "ecs:DescribeTaskDefinition",
                        "cloudwatch:GetMetricWidgetImage",
                        "cloudwatch:GetLogEvents",
                        "states:ListExecutions",
                        "iam:PassRole",
                        "gamelift:DescribeFleetCapacity",
                        "gamelift:DescribePlayerSessions",
                        "gamelift:UpdateMatchmakingConfiguration",
                        "gamelift:StartMatchmaking",
                        "gamelift:DescribeMatchmakingRuleSets",
                        "gamelift:ValidateMatchmakingRuleSet",
                        "gamelift:CreateMatchmakingRuleSet",
                        "gamelift:DeleteMatchmakingRuleSet",
                        "gamelift:UpdateFleetCapacity",
                        "gamelift:CreateFleetLocations",
                        "gamelift:DeleteFleetLocations",
                        "gamelift:PutScalingPolicy",
                        "gamelift:DeleteScalingPolicy",
                        "gamelift:ListAliases",
                        "gamelift:DescribeGameSessionQueues",
                        "gamelift:ListFleets",
                        "gamelift:DescribeGameSessions",
                        "gamelift:DescribeFleetLocationAttributes",
                        "gamelift:DescribeFleetLocationCapacity",
                        "gamelift:DescribeInstances",
                        "gamelift:DescribeRuntimeConfiguration",
                        "gamelift:DescribeFleetAttributes",
                        "gamelift:DescribeFleetEvents",
                        "gamelift:DescribeFleetUtilization",
                        "gamelift:DescribeMatchmakingConfigurations",
                        "gamelift:DescribeScalingPolicies"
                    }
                }));

            managementServiceFunctionRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
                {
                    Actions = new[]
                    {
                        "ecs:DescribeTasks",
                        "ecs:ListTasks",
                    },
                    Effect = Effect.ALLOW,
                    Resources = new[] {"*"},
                    Conditions = new Dictionary<string, object>
                    {
                        { "ArnEquals", new Dictionary<string, string> { { "ecs:Cluster", VirtualPlayersRunnerCluster.ClusterArn } } }
                    },
                    
                }));
            
            managementServiceFunctionRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Actions = new[]
                {
                    "ecs:StopTask",
                    "ecs:RunTask",
                },
                Effect = Effect.ALLOW,
                Resources = new[] {"*"},
                Conditions = new Dictionary<string, object>
                {
                    { "ArnEquals", new Dictionary<string, string> { { "ecs:Cluster", VirtualPlayersRunnerCluster.ClusterArn } } },
                    { "StringEquals", new Dictionary<string, string> { { "ecs:ResourceTag/AmazonGameLiftTestingToolkit-VirtualPlayers", "true" } } },
                },
                    
            }));

            props.ManagementConnectionsTable.GrantReadWriteData(ManagementServiceFunction);
            props.EventLogTable.GrantReadData(ManagementServiceFunction);
            props.MatchmakingSimulationTable.GrantReadWriteData(ManagementServiceFunction);
            props.SimulationPlayersTable.GrantReadWriteData(ManagementServiceFunction);
            props.PlayerProfileTable.GrantReadWriteData(ManagementServiceFunction);
            props.TicketLogTable.GrantReadData(ManagementServiceFunction);
            props.SimulationResultsTable.GrantReadData(ManagementServiceFunction);
            props.GameSessionTable.GrantReadWriteData(ManagementServiceFunction);
            props.StateLogTable.GrantReadData(ManagementServiceFunction);
            props.ManagementConfigTable.GrantReadData(ManagementServiceFunction);
            
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(managementServiceFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch and GameLift generic components"
                }
            }, true);

            var stateEventFunctionRole = new Role(this, "stateEventFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            stateEventFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            StateEventHandlerFunction = new Function(this, "StateEventHandlerLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.EventHandlers::StateEventHandler",
                Environment = new Dictionary<string, string>
                {
                    ["ConnectionsTableName"] = props.ManagementConnectionsTable.TableName,
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = stateEventFunctionRole
            });
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(stateEventFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);
            
            props.ManagementConnectionsTable.GrantReadWriteData(StateEventHandlerFunction);

            var configPopulatorFunctionRole = new Role(this, "ConfigPopulatorFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            configPopulatorFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            ConfigPopulatorFunction = new Function(this, "MgmtConfigPopulatorLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.ManagementService::PopulateConfigData",
                Environment = new Dictionary<string, string>
                {
                    ["ConfigTableName"] = props.ManagementConfigTable.TableName,
                    ["FlexMatchSimulatorArn"] = FlexMatchSimulator.AttrArn,
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = configPopulatorFunctionRole
            });
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(configPopulatorFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);
            
            props.ManagementConfigTable.GrantReadWriteData(ConfigPopulatorFunction);
            
            var flexMatchEventFunctionRole = new Role(this, "FlexMatchEventFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            flexMatchEventFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            FlexMatchEventFunction = new Function(this, "FlexMatchEventLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.EventHandlers::FlexMatchEventHandler",
                Environment = new Dictionary<string, string>
                {
                    ["ConfigTableName"] = props.ManagementConfigTable.TableName,
                    ["TicketLogTableName"] = props.TicketLogTable.TableName,
                    ["MatchmakingSimulationTableName"] = props.MatchmakingSimulationTable.TableName,
                    ["SimulationResultsTableName"] = props.SimulationResultsTable.TableName,
                    ["SimulationPlayersTableName"] = props.SimulationPlayersTable.TableName,
                    ["ConnectionsTableName"] = props.ManagementConnectionsTable.TableName,
                    ["EventLogTableName"] = props.EventLogTable.TableName,
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = flexMatchEventFunctionRole
            });
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(flexMatchEventFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);
            
            props.EventLogTable.GrantReadWriteData(FlexMatchEventFunction);
            props.ManagementConfigTable.GrantReadData(FlexMatchEventFunction);
            props.TicketLogTable.GrantReadWriteData(FlexMatchEventFunction);
            props.ManagementConnectionsTable.GrantReadWriteData(FlexMatchEventFunction);
            props.MatchmakingSimulationTable.GrantReadWriteData(FlexMatchEventFunction);
            props.SimulationPlayersTable.GrantReadData(FlexMatchEventFunction);
            props.SimulationResultsTable.GrantReadWriteData(FlexMatchEventFunction);

            var queuePlacementEventFunctionRole = new Role(this, "QueuePlacementEventFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            });
            queuePlacementEventFunctionRole.AddToPrincipalPolicy(DefaultLambdaPolicy);
            QueuePlacementEventFunction = new Function(this, "QueuePlacementEventLambdaFunction", new FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.EventHandlers::QueuePlacementEventHandler",
                Environment = new Dictionary<string, string>
                {
                    ["EventLogTableName"] = props.EventLogTable.TableName,
                    ["ConnectionsTableName"] = props.ManagementConnectionsTable.TableName,
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
                Role = queuePlacementEventFunctionRole
            });
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(queuePlacementEventFunctionRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access CloudWatch components"
                }
            }, true);
            
            props.EventLogTable.GrantReadWriteData(QueuePlacementEventFunction);
            props.ManagementConnectionsTable.GrantReadWriteData(QueuePlacementEventFunction);
        }
        
        private void CreateFlexMatchSimulator(Construct scope)
        {
            var gameProperties = new List<CfnMatchmakingConfiguration.GamePropertyProperty>();

            dynamic team = new {name = "MyTeam", minPlayers = 2, maxPlayers = 2};
            dynamic ruleSetBody = new {name="SampleSimulatorRuleset", ruleLanguageVersion="1.0", teams=new dynamic[] {team}};
            
            var ruleSet = new CfnMatchmakingRuleSet(this, "SampleSimulatorRuleset", new CfnMatchmakingRuleSetProps
            {
                Name="SampleSimulatorRuleset",
                RuleSetBody = JsonConvert.SerializeObject(ruleSetBody)
            });

            FlexMatchSimulator = new CfnMatchmakingConfiguration(this, "MMSimulatorConfig", new CfnMatchmakingConfigurationProps
            {
                AcceptanceRequired = false,
                BackfillMode = "MANUAL",
                Description = "Flexmatch simulator config",
                FlexMatchMode = "STANDALONE",
                GameProperties = gameProperties.ToArray(),
                GameSessionData = "Somedata",
                RequestTimeoutSeconds = 60,
                RuleSetName = ruleSet.Name,
                Name = "MMSimulatorConfig"
            });
            
            FlexMatchSimulator.AddDependsOn(ruleSet);
        }
    }
}
