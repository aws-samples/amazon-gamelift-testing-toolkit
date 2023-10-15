// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Ecr.Assets;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.Logs;
using Cdklabs.CdkNag;
using Constructs;

namespace SampleGameInfra.Lib
{
    public class ApiGwLogsStack : Stack
    {
        internal ApiGwLogsStack(Construct scope, string id) : base(scope, id)
        {            
            // Configure Log role for ApiGateway
            var apigwLogRole = new Role(this, "apigwLogRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("apigateway.amazonaws.com")
            });
            apigwLogRole.AddManagedPolicy(ManagedPolicy.FromManagedPolicyArn(this, "ApiGwLogPolicy", "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"));
            
            NagSuppressions.AddResourceSuppressions(apigwLogRole, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM4",
                    Reason = "Suppress finding for APIGW Log Policy used to create this stack"
                },
            }, true);
            
            var cfnAccount = new CfnAccount(this, "APIGWAccount", new CfnAccountProps
            {
                CloudWatchRoleArn = apigwLogRole.RoleArn
            });
        }
    }
}