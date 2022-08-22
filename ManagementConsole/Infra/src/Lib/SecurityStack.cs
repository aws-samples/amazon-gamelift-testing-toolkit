// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.KMS;
using Constructs;

namespace ManagementConsoleInfra.Lib
{
    public class SecurityProps : StackProps
    {
        
    }
    public class SecurityStack : Stack
    {
        public Key EncryptionKey;
        public Role MgmtLambdaRole;
        public Role AuthRole;
        public Role StatePollerRole; 
        internal SecurityStack(Construct scope, string id, SecurityProps props = null) : base(scope, id, props)
        {
            EncryptionKey = new Key(this, "AGTTCMK", new KeyProps
            {
                EnableKeyRotation = true,
            });
            EncryptionKey.AddToResourcePolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[] {"*"},
                Principals = new []
                {
                    new ServicePrincipal("logs." + Fn.Ref("AWS::Region") + ".amazonaws.com"),
                    new ServicePrincipal("apigateway.amazonaws.com"),
                },
                Actions = new[]
                {
                    "kms:Encrypt*",
                    "kms:Decrypt*",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:Describe*"
                }
            }));
        }
    }
}
