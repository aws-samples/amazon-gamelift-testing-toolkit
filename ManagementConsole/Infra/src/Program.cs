// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.Lambda;
using Cdklabs.CdkNag;
using ManagementConsoleInfra.Lib;

namespace ManagementConsoleInfra
{
    sealed class Program
    {
        internal static readonly Runtime DotNetRuntime = Runtime.DOTNET_6;

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
            Aspects_.Of(scope).Add(check);
        }

        private static NagPackSuppression[] BuildSuppressions()
        {
            return new NagPackSuppression[]
            {
                BuildSuppressions("AwsSolutions-CFR1", "Geo restrictions not required for sample code."),
                BuildSuppressions("AwsSolutions-CFR2", "WAF not required for sample code."),
                BuildSuppressions("AwsSolutions-CFR3", "Additional logging not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-COG1", "Spurious password constraints aren't required."),
                BuildSuppressions("AwsSolutions-COG2", "MFA is too prescriptive for sample code."),
                BuildSuppressions("AwsSolutions-ECS4", "Container Insights not required for testing toolkit."),
                BuildSuppressions("AwsSolutions-S1", "Additional logging not required for testing toolkit."),
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
