// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.SecurityToken.Model;
using Amazon.SecurityToken;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using Newtonsoft.Json;

namespace SampleGameBuild.NumbersQuiz.Server
{
    public class AwsHandler
    {
        public static Credentials Credentials;

        public static bool AssumeInstanceRole(string roleArn)
        {
            GameLogger.Log("Trying to assume role!");
            
            try
            {
                AWSCredentials credentials = null;
                AmazonSecurityTokenServiceClient client;
                SharedCredentialsFile sf = new SharedCredentialsFile();
                foreach (var profile in sf.ListProfiles())
                {
                    if (profile.Name == "falken")
                    {
                        credentials = profile.GetAWSCredentials(sf);
                        Console.WriteLine($"Got {profile.Name} credentials using SharedCredentialsFile");
                    }
                }

                if (credentials!=null)
                {
                    client = new AmazonSecurityTokenServiceClient(credentials);
                }
                else
                {
                    client = new AmazonSecurityTokenServiceClient();
                }
                
                var response = client.AssumeRoleAsync(new AssumeRoleRequest
                {
                    RoleArn = roleArn,
                    RoleSessionName = "testAssumeRoleSession",
                });
                
                Credentials = response.Result.Credentials;
                GameLogger.Log("assumed role");
                return true;
            }
            catch (Exception e)
            {
                GameLogger.Log(e.ToString());
                /*
                Amazon.Runtime.AWSCredentials credentials = new Amazon.Runtime.StoredProfileAWSCredentials("falken");
                var client = new AmazonSecurityTokenServiceClient(credentials);
                try
                {
                    var response = client.AssumeRoleAsync(new AssumeRoleRequest
                    {
                        RoleArn = roleArn,
                        RoleSessionName = "testAssumeRoleSession",
                    });
                
                    Credentials = response.Result.Credentials;
                    return true;
                }*/
            }

            return false;
        }
    }
}