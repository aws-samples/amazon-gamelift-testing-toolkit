// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.GameLift;
using Amazon.CDK.AWS.IAM;
using Constructs;

namespace CDK.Constructs
{
    public struct FleetIqGameServerGroupProps
    {
        public string AmiId;
    }
    
    public class FleetIqGameServerGroup : Construct
    {
        internal FleetIqGameServerGroup(Construct scope, string id, FleetIqGameServerGroupProps props) : base(scope, id)
        {
            var fleetIqRole = new Role(this, "FleetIqRole", new RoleProps
            {
                AssumedBy = new CompositePrincipal(new PrincipalBase[ ] {
                    new ServicePrincipal("gamelift.amazonaws.com"),   // required
                    new ServicePrincipal("autoscaling.amazonaws.com"),   // allow account to assume role for testing
                })
            });

            fleetIqRole.AddManagedPolicy(ManagedPolicy.FromAwsManagedPolicyName("GameLiftGameServerGroupPolicy"));

            var fleetIqRoleForEc2 = new Role(this, "FleetIqRoleForEc2", new RoleProps
            {
                AssumedBy = new ServicePrincipal("ec2.amazonaws.com")
            });
            
            fleetIqRoleForEc2.AddToPolicy(new PolicyStatement(new PolicyStatementProps
            {
                Effect = Effect.ALLOW,
                Resources = new[] {"*"},
                Actions = new[]
                {
                    "gamelift:*",
                }
            }));
            
            var fleetIqInstanceProfile = new CfnInstanceProfile(this, "FleetIqEC2InstanceProfile",
                new CfnInstanceProfileProps
                {
                    Roles = new string[] { fleetIqRoleForEc2.RoleName }
                });

            var cfnLaunchTemplate = new CfnLaunchTemplate(this, "FleetIqLaunchTemplate", new CfnLaunchTemplateProps
            {
                LaunchTemplateData = new CfnLaunchTemplate.LaunchTemplateDataProperty
                {
                    ImageId = props.AmiId,
                    IamInstanceProfile = new CfnLaunchTemplate.IamInstanceProfileProperty
                    {
                        Arn = fleetIqInstanceProfile.AttrArn
                    },
                    InstanceType = "c4.large"
                }
            });
            
            var gameServerGroup = new CfnGameServerGroup(this, "GameServerGroup", new CfnGameServerGroupProps
            {
                GameServerGroupName = "NumbersQuiz-GSG",
                InstanceDefinitions = new CfnGameServerGroup.InstanceDefinitionProperty []
                {
                    new CfnGameServerGroup.InstanceDefinitionProperty
                    {
                        InstanceType = "c4.large",
                        WeightedCapacity = "1"
                    },
                    new CfnGameServerGroup.InstanceDefinitionProperty
                    {
                        InstanceType = "c5.large",
                        WeightedCapacity = "1"
                    },
                },
                LaunchTemplate = new CfnGameServerGroup.LaunchTemplateProperty
                {
                    //LaunchTemplateName = cfnLaunchTemplate.LaunchTemplateName
                    LaunchTemplateId = Fn.Ref(cfnLaunchTemplate.LogicalId)
                },
                GameServerProtectionPolicy = "NO_PROTECTION",
                RoleArn = fleetIqRole.RoleArn
            });
        }
    }
}