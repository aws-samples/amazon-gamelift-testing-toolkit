// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.ImageBuilder;
using Amazon.CDK.AWS.SSM;
using Constructs;

namespace CDK.Constructs
{
    public struct FleetIqAmiBuildProps
    {
        public string Name;
        public string ParentImage;
        public string Version;
        public List<CfnComponentProps> ComponentPropsList;
        public string SsmParameterName;
    }

    public struct AmiComponentProps
    {
        public string Data;
        public string Version;
        public string Name;
    }
    
    public class FleetIqAmiBuild : Construct
    {
        public readonly CfnImage Image;
        public StringParameter SsmParameter;
        public CfnOutput AmiRegion;
        public CfnOutput AmiId;
        
        internal FleetIqAmiBuild(Construct scope, string id, FleetIqAmiBuildProps props) : base(scope, id)
        {
            var role = new Role(this, "ImageBuilderRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("ec2.amazonaws.com")
            });
            
            role.AddManagedPolicy(ManagedPolicy.FromAwsManagedPolicyName("EC2InstanceProfileForImageBuilder"));
            role.AddManagedPolicy(ManagedPolicy.FromAwsManagedPolicyName("EC2InstanceProfileForImageBuilderECRContainerBuilds"));
            role.AddManagedPolicy(ManagedPolicy.FromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));
            
            var instanceProfile = new CfnInstanceProfile(this, "ImageBuilderInstanceProfile",
                new CfnInstanceProfileProps
                {
                    Roles = new string[] { role.RoleName }
                });
            
            var components = new List<CfnImageRecipe.ComponentConfigurationProperty>();
            var componentNum = 1;
            foreach (var componentProps in props.ComponentPropsList)
            {
                var component = new CfnComponent(this, "ImageComponent" + componentNum, new CfnComponentProps
                {
                    Data = componentProps.Data,
                    Name = componentProps.Name,
                    Version = componentProps.Version,
                    Platform = componentProps.Platform,
                });

                components.Add(new CfnImageRecipe.ComponentConfigurationProperty
                {
                    ComponentArn = Fn.Ref(component.LogicalId)
                });
            }

            var recipe = new CfnImageRecipe(this, "ImageRecipe", new CfnImageRecipeProps
            {
                Name = props.Name,
                ParentImage = props.ParentImage,
                Version = props.Version,
                Components = components.ToArray(),
            });

            var infrastructureConfiguration = new CfnInfrastructureConfiguration(this, "InfrastructureConfiguration",
                new CfnInfrastructureConfigurationProps
                {
                    Name = "ImageBuilderInfrastructureConfig",
                    InstanceProfileName = Fn.Ref(instanceProfile.LogicalId),
                });

            Image = new CfnImage(this, "Image", new CfnImageProps
            {
                ImageRecipeArn = Fn.Ref(recipe.LogicalId),
                InfrastructureConfigurationArn = Fn.Ref(infrastructureConfiguration.LogicalId)
            });
        }
    }
}