# Security

When you build systems on AWS infrastructure, security responsibilities are shared between you and AWS. This [shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/) reduces your operational burden because AWS operates, manages, and controls the components including the host operating system, the virtualization layer, and the physical security of the facilities in which the services operate. For more information about AWS security, visit [AWS Cloud Security](http://aws.amazon.com/security/).

## Amazon CloudFront

This solution deploys a web console [hosted](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html) in an Amazon S3 bucket. To help reduce latency and improve security, this solution includes an Amazon CloudFront distribution with an origin access identity, which is a CloudFront user that provides public access to the solution&#39;s website bucket contents. For more information, refer to [Restricting Access to Amazon S3 Content by Using an Origin Access Identity](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html) in the _Amazon CloudFront Developer Guide_.

## Amazon Cognito

An Amazon Cognito user pool is used to authenticate users of the web console. It is configured as a provider for a Cognito identity pool that uses an IAM role to authorize access to the management services API Gateway.

## IAM roles

AWS Identity and Access Management (IAM) roles allow customers to assign granular access policies and permissions to services and users on the AWS Cloud.

This solution creates a number of IAM roles that grant the solution&#39;s Lambda functions, Step Functions, and ECS tasks access to the resources they depend on.

## Amazon Virtual Private Cloud

An Amazon VPC is used to create a virtual network for the virtual players. The virtual players&#39; ECS tasks run in private subnets, and access the GameLift servers and the game client services over the public Internet via [NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html).