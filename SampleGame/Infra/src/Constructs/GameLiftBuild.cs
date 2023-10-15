// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.GameLift;
using Constructs;

namespace TestGame.CDK.Constructs
{
    public struct GameLiftBuildProps
    {
        public string AssetPath;
        public string Name;
        public string Version;
        public string OperatingSystem;
        public string ServerSdkVersion;
    }

    public struct GameLiftBuildOs
    {
        public static string AmazonLinux2 = "AMAZON_LINUX_2";
        public static string Windows2016 = "WINDOWS_2016";
        public static string AmazonLinux2023 = "AMAZON_LINUX_2023";
    }
     
    public class GameLiftBuild : Construct
    {
        public readonly GameLiftBuildAsset BuildAsset;
        public readonly string BuildId;
        public readonly CfnBuild CfnBuild;

        internal GameLiftBuild(Construct scope, string id, GameLiftBuildProps props) : base(scope, id)
        {
            BuildAsset = new GameLiftBuildAsset(scope, "GameLiftBuildAsset", new GameLiftAssetProps
            {
                AssetPath = props.AssetPath,
            });

            CfnBuild = new CfnBuild(this, "Build", new CfnBuildProps
            {
                Name = props.Name,
                OperatingSystem = props.OperatingSystem,
                StorageLocation = new CfnBuild.StorageLocationProperty
                {
                    Bucket = BuildAsset.Asset.S3BucketName,
                    Key = BuildAsset.Asset.S3ObjectKey,
                    RoleArn = BuildAsset.Role.RoleArn
                },
                Version = props.Version,
                ServerSdkVersion = props.ServerSdkVersion,
            });
            
            CfnBuild.Node.AddDependency(BuildAsset);
            BuildId = Fn.Ref(CfnBuild.LogicalId);
        }
    }
}