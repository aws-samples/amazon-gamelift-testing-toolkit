// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class CfnRequest 
    {
        public string RequestType { get; set; }
        public string ResponseURL { get; set; }
        public string StackId { get; set; }
        public string RequestId { get; set; }
        public string ResourceType { get; set; }
        public string LogicalResourceId { get; set; }
        public ResourceProperties ResourceProperties { get; set; }
        public ResourceProperties OldResourceProperties { get; set; }
    }

    public class ResourceProperties
    {
        public string ServiceToken { get; set; }
    }

    public class CfnResponse
    {
        public string Status { get; set; }
        public string Reason { get; set; }
        public string PhysicalResourceId { get; set; }
        public string StackId { get; set; }
        public string RequestId { get; set; }
        public string LogicalResourceId { get; set; }
        public bool NoEcho { get; set; }
        public object Data;
    }

    public class AuthenticationTokenResponse
    {
        public string Token;
    }
}