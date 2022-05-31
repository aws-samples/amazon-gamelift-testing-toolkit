// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Cdklabs.CdkNag;
using ManagementConsoleInfra.Lib;

namespace ManagementConsoleInfra
{
    sealed class Program
    {
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
            var nagProps = new NagPackProps() { Verbose = true };
            var check = new AwsSolutionsChecks(nagProps);
            Aspects_.Of(scope).Add(check);
        }
    }
}
