// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.Lambda;
using Cdklabs.CdkNag;
using Constructs;
using ManagementConsoleInfra.Lib;

namespace ManagementConsoleInfra
{
    sealed class Program
    {
        internal static readonly Runtime DotNetRuntime = Runtime.DOTNET_CORE_3_1;

        public static void Main(string[] args)
        {
            var app = new App();
            var infra = new InfraStage(app, "AGTT-ManagementConsoleStack", new InfraStageProps());

            CheckCdkNag(infra);
            app.Synth();
        }

        private static void CheckCdkNag(IConstruct scope)
        {
            // Check against standard cdk nag rules
            var nagProps = new NagPackProps() { Verbose = false };

            NagSuppressions.AddResourceSuppressions(scope, BuildSuppressions(), true);

            var check = new AwsSolutionsChecks(nagProps);
            Aspects.Of(scope).Add(check);
        }

        private static NagPackSuppression[] BuildSuppressions()
        {
            return new NagPackSuppression[]
            {
                BuildSuppressions("AwsSolutions-APIG4", "API Gateway WebSocket $default route does not support authorization."),
                BuildSuppressions("AwsSolutions-CFR1", "Geo restrictions not required for sample code."),
                BuildSuppressions("AwsSolutions-CFR2", "WAF not required for sample code."),
                BuildSuppressions("AwsSolutions-CFR3", "Additional logging not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-CFR4", "Distribution uses default CloudFront certificate with supports TLS 1.0."),
                BuildSuppressions("AwsSolutions-COG1", "Spurious password constraints aren't required."),
                BuildSuppressions("AwsSolutions-COG2", "MFA is too prescriptive for sample code."),
                BuildSuppressions("AwsSolutions-COG3", "CDK version does not support AdvancedSecurityMode."),
                BuildSuppressions("AwsSolutions-ECS4", "Container Insights not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-L1", "Non-compliance caused by CDK package Amazon.CDK.AWS.S3.Deployment."),
                BuildSuppressions("AwsSolutions-S1", "Additional logging not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-S5", "PublicReadAccess set to false, BlockPublicAccess set to BLOCK_ALL, and OAI configured in bucket policy. However, bucket uses CDK's AutoDeleteObjects which breaks cdk-nag."),
                BuildSuppressions("AwsSolutions-SF1", "Additional logging not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-SF2", "X-Ray not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-VPC7", "Flow logs not required for testing toolkit."),
            };
        }

        private static NagPackSuppression BuildSuppressions(string id, string reason)
        {
            return new NagPackSuppression()
            {
                Id = id,
                Reason = reason
            };
        }
    }
}
