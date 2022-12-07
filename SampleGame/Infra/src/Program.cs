// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.Lambda;
using Cdklabs.CdkNag;
using Constructs;
using SampleGameInfra.Lib;

namespace SampleGameInfra
{
    sealed class Program
    {
        private const string StackName = "AGTT-SampleGameStack";

        internal static readonly Runtime DotNetRuntime = Runtime.DOTNET_6;

        public static void Main(string[] args)
        {
            var app = new App();
            var infra = new InfraStage(app, StackName, new InfraStageProps());

            CheckCdkNag(infra);
            app.Synth();
        }

        private static void CheckCdkNag(IConstruct scope)
        {
            // Check against standard cdk nag rules
            var nagProps = new NagPackProps() { Verbose = false };
            var check = new AwsSolutionsChecks(nagProps);
            NagSuppressions.AddResourceSuppressions(scope, BuildSuppressions(), true);
            Aspects.Of(scope).Add(check);
        }

        private static NagPackSuppression[] BuildSuppressions()
        {
            return new NagPackSuppression[]
            {
                BuildSuppressions("AwsSolutions-APIG4", "API Gateway WebSocket $default route does not support authorization."),
                BuildSuppressions("AwsSolutions-ECS7", "Container logging not required for sample game virtual players."),
                BuildSuppressions("AwsSolutions-COG7", "Sample game doesn't require players to have a user account."),
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
