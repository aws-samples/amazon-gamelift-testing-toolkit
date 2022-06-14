// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.S3.Assets;
using Cdklabs.CdkNag;

namespace TestGame.CDK.Constructs
{
     public struct GameLiftAssetProps
     {
         public string AssetPath;
     }
     
    public class GameLiftBuildAsset : Construct
    {
        public Role Role;
        public Asset Asset;
       
        internal GameLiftBuildAsset(Construct scope, string id, GameLiftAssetProps props) : base(scope, id)
        {
            Role = new Role(this, "GameLiftBuildRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("gamelift.amazonaws.com"),   // required
            });
            
            Asset = new Asset(this, "BuildAsset", new AssetProps
            {
                Path = props.AssetPath,
            });
            
            Asset.Bucket.GrantRead(Role, "assets/*");
            
            // Adding specific CDK-Nag Suppressions
            NagSuppressions.AddResourceSuppressions(Role, new INagPackSuppression[]
            {
                new NagPackSuppression
                {
                    Id = "AwsSolutions-IAM5",
                    Reason = "Suppress wildcard finding to give permission to access S3 asset folder"
                }
            }, true);
        }
    }
}