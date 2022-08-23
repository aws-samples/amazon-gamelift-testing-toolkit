// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.Apigatewayv2.Alpha;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.Cognito;
using Amazon.CDK.AWS.Cognito.IdentityPool.Alpha;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Cdklabs.CdkNag;
using Constructs;

namespace ManagementConsoleInfra.Lib
{
    public class WebProps : StackProps
    {
        public WebSocketStage ApiProdStage;
    }
    public class WebStack : Stack
    {
        public OriginAccessIdentity Oai;
        public Bucket WebsiteBucket;
        public CloudFrontWebDistribution WebDistribution;
        public UserPool WebUserPool;
        public UserPoolClient WebUserPoolClient;
        public IdentityPool WebIdentityPool;

        public static string ProjectRoot = "../Backend";
        
        internal WebStack(Construct scope, string id, WebProps props = null) : base(scope, id, props)
        {
            Oai = new OriginAccessIdentity(this, "OAI");
            WebsiteBucket = new Bucket(this, "WebsiteBucket", new BucketProps
            {
                PublicReadAccess = false,
                BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
                WebsiteIndexDocument = "index.html",
                WebsiteErrorDocument = "error.html",
                RemovalPolicy = RemovalPolicy.DESTROY,
                AutoDeleteObjects = true,
                Encryption = BucketEncryption.S3_MANAGED,
                EnforceSSL = true,
            });
            WebsiteBucket.GrantRead(Oai);

            WebDistribution = new CloudFrontWebDistribution(this, "WebsiteCloudfrontDistribution", new CloudFrontWebDistributionProps
            {
                OriginConfigs = new [] 
                { 
                    new SourceConfiguration 
                    {
                        S3OriginSource = new S3OriginConfig {
                            S3BucketSource = WebsiteBucket,
                            OriginAccessIdentity = Oai,
                        },
                        Behaviors = new [] 
                        { 
                            new Behavior
                            {
                                IsDefaultBehavior = true,
                                DefaultTtl = Duration.Seconds(300),
                            } 
                        }
                    }
                },
                PriceClass = PriceClass.PRICE_CLASS_100,
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            });
            
            var deployment = new BucketDeployment(this, "DeployTest", new BucketDeploymentProps
            {
                Sources = new [] { Source.Asset("../UI/dist")},
                DestinationBucket = WebsiteBucket, 
                MemoryLimit = 3000,
                Prune = false,
            });
            
            WebUserPool = new UserPool(this, "UserPool", new UserPoolProps
            {
                RemovalPolicy = RemovalPolicy.DESTROY, 
            });

            WebUserPoolClient = new UserPoolClient(this, "UserPoolClient", new UserPoolClientProps
            {
                AccessTokenValidity = Duration.Hours(24),
                UserPool = WebUserPool,
                GenerateSecret = false,
                SupportedIdentityProviders = new UserPoolClientIdentityProvider[]
                    { UserPoolClientIdentityProvider.COGNITO},
                OAuth = new OAuthSettings
                {
                    Flows = new OAuthFlows
                    {
                        AuthorizationCodeGrant = true,
                        ClientCredentials = false,
                        ImplicitCodeGrant = false,
                    },
                    CallbackUrls = new string[] {"http://localhost:8080", "http://localhost", "https://" + WebDistribution.DistributionDomainName},
                    LogoutUrls = new string[] {"http://localhost:8080", "http://localhost", "https://" + WebDistribution.DistributionDomainName},
                },
            });
            
            WebIdentityPool = new IdentityPool(this, "IdentityPool", new IdentityPoolProps
            {
                AllowUnauthenticatedIdentities = false,
                AuthenticationProviders = new IdentityPoolAuthenticationProviders
                {
                    UserPools = new [] { new UserPoolAuthenticationProvider(new UserPoolAuthenticationProviderProps
                    {
                        UserPool = WebUserPool, 
                        UserPoolClient = WebUserPoolClient,
                    }) }
                },
            });

            WebIdentityPool.AuthenticatedRole.AddToPrincipalPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[]
                {
                    $"arn:aws:execute-api:{this.Region}:*:{props.ApiProdStage.Api.ApiId}/{props.ApiProdStage.StageName}/*"
                },
                Actions = new[]
                {
                    "execute-api:Invoke"
                }
            }));

            var cognitoDomainPrefix = "falken-" + WebUserPoolClient.UserPoolClientId;
            var cognitoDomain = cognitoDomainPrefix + ".auth." + Fn.Ref("AWS::Region") + ".amazoncognito.com";
            var cognitoUrl = "https://" + cognitoDomain;

            WebUserPool.AddDomain("CognitoDomain", new UserPoolDomainOptions
            {
                CognitoDomain = new CognitoDomainOptions
                {
                    DomainPrefix = cognitoDomainPrefix
                }
            });

            var configJsonFunction = new Amazon.CDK.AWS.Lambda.Function(this, "ConfigJsonLambdaFunction", new Amazon.CDK.AWS.Lambda.FunctionProps
            {
                Runtime = Program.DotNetRuntime,
                Code = Code.FromAsset(ProjectRoot + "/bin/Release/netcoreapp3.1"),
                Handler = "ManagementConsoleBackend::ManagementConsoleBackend.ManagementService.ManagementService::ConfigJsonGenerator",
                Environment = new Dictionary<string, string>
                {
                    ["BucketName"] = WebsiteBucket.BucketName,
                    ["ApiUrl"] = props.ApiProdStage.Url,
                    ["CognitoDomain"] = cognitoDomain,
                    ["AppClientId"] = WebUserPoolClient.UserPoolClientId,
                    ["UserPoolId"] = WebUserPool.UserPoolId,
                    ["IdentityPoolId"] = WebIdentityPool.IdentityPoolId,
                    ["Region"] = Fn.Ref("AWS::Region"),
                },
                Timeout = Duration.Seconds(30),
                MemorySize = 1024,
            });

            WebsiteBucket.GrantReadWrite(configJsonFunction);
            
            var customResource = new CfnCustomResource(this, "ConfigJsonCustomResource", new CfnCustomResourceProps
            {
                ServiceToken = configJsonFunction.FunctionArn,
            });
            
            // run custom resource AFTER console deployment, to ensure an old dist/Config.json doesn't overwrite the Config.json created by the custom resource
            customResource.Node.AddDependency(deployment);
            customResource.Node.AddDependency(configJsonFunction);
            
            new CfnOutput(this, "cloudfrontDomainName", new CfnOutputProps
            {
                Value = WebDistribution.DistributionDomainName
            });
            
            
            new CfnOutput(this, "appClientId", new CfnOutputProps
            {
                Value = WebUserPoolClient.UserPoolClientId
            });
            
            new CfnOutput(this, "userPoolId", new CfnOutputProps
            {
                Value = WebUserPool.UserPoolId
            });
            
            new CfnOutput(this, "identityPoolId", new CfnOutputProps
            {
                Value = WebIdentityPool.IdentityPoolId
            });
            
            new CfnOutput(this, "region", new CfnOutputProps
            {
                Value = Fn.Ref("AWS::Region")
            });
            
            new CfnOutput(this, "cognitoUrl", new CfnOutputProps
            {
                Value = "https://" + cognitoDomain
            });
            
            new CfnOutput(this, "cognitoDomain", new CfnOutputProps
            {
                Value = cognitoDomain
            });

            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(this, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Default role used by CDK construct to deploy content to S3"
                },
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM4",
                    Reason = "Default role used by CDK construct to deploy content to S3"
                }
            }, true);
        }
    }
}
