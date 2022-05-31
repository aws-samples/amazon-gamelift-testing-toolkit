# Removing the toolkit

You can remove the Amazon GameLift Testing Toolkit from your AWS account by using the source code's deployment script, the AWS Management Console, or the AWS Command Line Interface. 

### Using deployment script
You can remove the toolkit using the deployment script by opening a terminal window, navigating to the toolkit's root directory, and then running the following command:

```bash
yarn delete-toolkit [--profile <profileName>]
```

To remove the sample game, run the following command:

```bash
yarn delete-sample-game [--profile <profileName>]
```

### Using AWS Management Console

1. Sign in to the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation/home?).
2. Navigate to the *Stacks* page.
3. Select the AGTT-ManagementConsoleStack-WebStack stack, choose *Delete*, and wait until complete.
4. Select the AGTT-ManagementConsoleStack-BackendStack stack, choose *Delete*, and wait until complete.
5. Select the AGTT-ManagementConsoleStack-SecurityStack stack, choose *Delete*, and wait until complete.
6. Select the AGTT-ManagementConsoleStack-DataStack stack and choose *Delete*.

Optionally, to remove the sample game:

1. Sign in to the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation/home?).
2. Navigate to the *Stacks* page.
3. Select the AGTT-SampleGameStack-VirtualPlayerStack stack, choose *Delete*, and wait until complete.
4. Select the AGTT-SampleGameStack-BackendStack stack and choose *Delete*.

### Using AWS Command Line Interface

To delete from terminal window, determine the installation stack name and then run the following commands:

```bash
aws cloudformation delete-stack --stack-name AGTT-ManagementConsoleStack-WebStack
aws cloudformation delete-stack --stack-name AGTT-ManagementConsoleStack-BackendStack
aws cloudformation delete-stack --stack-name AGTT-ManagementConsoleStack-SecurityStack
aws cloudformation delete-stack --stack-name AGTT-ManagementConsoleStack-DataStack
```

If you installed the sample game, you can remove it by running the following commands:

```bash
aws cloudformation delete-stack --stack-name AGTT-SampleGameStack-VirtualPlayerStack
aws cloudformation delete-stack --stack-name AGTT-SampleGameStack-BackendStack
```

## Deleting the Amazon S3 buckets

This solution is configured to retain the solution-created Amazon S3 bucket (for deploying in an opt-in Region) if you decide to delete the AWS CloudFormation stack to prevent accidental data loss. After uninstalling the solution, you can manually delete this S3 bucket if you do not need to retain the data. Follow these steps to delete the Amazon S3 bucket.

1. Sign in to the [Amazon S3 console](https://console.aws.amazon.com/s3/home).
2. Choose  *Buckets*  from the left navigation pane.
3. Locate the *agtt-managementconsolestack-websitebucket{IDENTIFIER}* S3 bucket.
4. Select the S3 bucket and choose  *Delete*.

To delete the S3 bucket using AWS CLI, run the following command:

```bash
aws s3 rb s3://agtt-managementconsolestack-websitebucket{IDENTIFIER} --force
```