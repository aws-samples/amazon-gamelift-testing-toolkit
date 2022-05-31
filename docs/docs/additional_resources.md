# Additional resources

## AWS services

The Amazon GameLift Testing toolkit uses the following AWS services:

* [Amazon API Gateway](https://aws.amazon.com/api-gateway/) 
* [AWS CloudFormation](https://aws.amazon.com/cloudformation/)
* [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) 
* [Amazon Elastic Container Registry](https://aws.amazon.com/ecr/) 
* [Amazon Cognito](https://aws.amazon.com/cognito/)
* [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) 
* [Amazon ECS](https://aws.amazon.com/ecs/)
* [Amazon EventBridge](https://aws.amazon.com/eventbridge/)
* [AWS Fargate](https://aws.amazon.com/fargate/)
* [Amazon GameLift](https://aws.amazon.com/gamelift/)
* [AWS Identity and Access Management](https://aws.amazon.com/iam/)
* [AWS Lambda](https://aws.amazon.com/lambda/)
* [Amazon S3](https://aws.amazon.com/s3/)
* [Amazon Step Functions](https://aws.amazon.com/step-functions/)
  
## Costs

You are responsible for the cost of the AWS services used while running this solution. 

As of November 2021, the cost for running this solution with the default settings and 8 virtual players in the us-east-1 region (N.Virginia) is approximately **$0.52 for 1 hour testing on a C5.large on demand instance and a C5.large spot instance**. However, be aware the costs of running bigger tests with more virtual players and larger fleet sizes will scale with the increase in resources, so before testing at scale you should run smaller tests and verify the costs first.   

| **AWS service** | Resources | Cost |
| --- | --- | --- |
| Amazon GameLift | 1x C5.large spot instance | $0.028 |
| Amazon GameLift | 1x C5.large on demand instance | $0.109 |
| Amazon Fargate | 8x vCPU hour | $0.323 |
| Step Functions | 1,000 state transitions | $0.025 |
| DynamoDB | 1,000 On-demand Write requests | $0.010 |
| DynamoDB | 3,000 On-demand Read requests | $0.000 |
| Lambda | 5,000 requests | $0.010 |
| Lambda | 125 GB seconds duration | $0.000 |
| NAT Gateway | 1 hour duration | $0.045 |
| | **Total cost:** | **$0.522** |

We recommend creating a [budget](https://alpha-docs-aws.amazon.com/awsaccountbilling/latest/aboutv2/budgets-create.html) through [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) to help manage costs. Prices are subject to change. For full details, refer to the pricing webpage for each AWS service used in this solution.

## Source code

Visit our GitHub repository to download the source files for this solution and to share your customizations with others. The Amazon GameLift Testing Toolkit templates are generated using the [AWS Cloud Development Kit (AWS CDK)](http://aws.amazon.com/cdk/). Refer to the [README.md file](https://github.com/awslabs/aws-instance-scheduler/blob/master/README.md) for additional information.

## Notices

Customers are responsible for making their own independent assessment of the information in this document. This document: (a) is for informational purposes only, (b) represents AWS current product offerings and practices, which are subject to change without notice, and (c) does not create any commitments or assurances from AWS and its affiliates, suppliers or licensors. AWS products or services are provided &quot;as is&quot; without warranties, representations, or conditions of any kind, whether express or implied. AWS responsibilities and liabilities to its customers are controlled by AWS agreements, and this document is not part of, nor does it modify, any agreement between AWS and its customers.

Amazon GameLift Testing Toolkit is licensed under the terms of the of the Apache License Version 2.0 available at [The Apache Software Foundation](https://www.apache.org/licenses/LICENSE-2.0).

Copyright (c) 2022 by Amazon.com, Inc. or its affiliates.
Amazon GameLift Testing Toolkit is licensed under the terms of the Apache License Version 2.0 available at
[The Apache Software Foundation](https://www.apache.org/licenses/LICENSE-2.0)