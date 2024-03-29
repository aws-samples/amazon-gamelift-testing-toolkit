# Amazon GameLift Testing Toolkit

![aws provider](https://img.shields.io/badge/provider-AWS-orange?logo=amazon-aws&color=ff9900) ![Build status](https://github.com/aws-samples/amazon-gamelift-testing-toolkit/actions/workflows/build.yml/badge.svg)

A test harness and visualisation tool for Amazon GameLift and Amazon GameLift FlexMatch.  The toolkit lets you visualise your GameLift infrastructure, launch virtual players, and iterate upon your FlexMatch rule sets with the FlexMatch simulator.

**[📜Documentation](https://aws-samples.github.io/amazon-gamelift-testing-toolkit/)**

Whether you're starting development of a multiplayer game with dedicated servers, or have already written a game using Amazon GameLift, you can quickly get the Amazon GameLift Testing Toolkit deployed and running.

The quickest way to get started is to build and deploy the toolkit and the sample game, and you can then delete the sample game when you no longer need it.

## Prerequisites

* An existing AWS account.
* The [AWS Command Line Interface (CLI)](https://aws.amazon.com/cli/) installed locally.
* [Node.js 18.x](https://nodejs.org/) installed locally, including npm.
* [.NET 6](https://dotnet.microsoft.com/en-us/download/dotnet) installed locally.
* A local copy of the toolkit source code.

Additionally, if you intend to deploy the sample game or create virtual players you will also need:

* [Docker](https://www.docker.com/) installed and you should be logged in to Docker Hub.

## Toolkit Build

```bash
dotnet tool install -g Amazon.Lambda.Tools
sudo npm install --global yarn
yarn
yarn build-toolkit
```


## Bootstrap

Before deploying the toolkit, but after building it, you will need to bootstrap the CDK environment as follows:

```bash
yarn bootstrap
```


## Toolkit Deployment

If you have configured the AWS CLI with multiple profiles you can pass in a name to choose which profile to target. 

```bash
yarn deploy-toolkit [--profile <profileName>]
```

When the deployment completes successfully the terminal will display a number of output variables. Make a note of the value of the `AmazonGameLiftTestingToolkit.CloudfrontDomainName ` variable and the `AmazonGameLiftTestingToolkit.userPoolId` variable, which you will use in the next stage.

## Sample Game

Optionally, if you want to build and deploy the sample game you should run the following commands: 

```bash
yarn build-sample-game
yarn deploy-sample-game [--profile <profileName>]
```

## First time login

The toolkit uses [Amazon Cognito](https://docs.aws.amazon.com/cognito) to authenticate and authorize access to its web console, so prior to logging in  you will need to create a user in the toolkit's Cognito User Pool. 

1. Login to the *AWS Management Console* and navigate to *Cognito*
2. In the list of *User Pools* select the *User Pool* with the *userPoolId* you previously noted.
3. In the *Users* tab, choose *Create user*.
3. In *Users and groups* select *Create user* and then enter your user details.

Once you've created a user, you can login by navigating to the URL previously noted in the `AmazonGameLiftTestingToolkit.CloudfrontDomainName ` variable.

## Other Useful commands

* `yarn delete-toolkit` Remove the toolkit from your AWS account
* `yarn delete-sample-game` Remove the sample game from your AWS account

## Supported Regions for Deployment

The toolkit and sample game can currently be deployed into any of the following regions which support placing a FlexMatch matchmaker.  Once deployed, you can add additional locations to your multi-location fleets from any region that GameLift supports.

* US East (N. Virginia)
* US West (Oregon)
* EU Central (Frankfurt)
* EU West (Ireland)
* Asia Pacific Southeast (Sydney)
* Asia Pacific Northeast (Seoul and Tokyo)

## Credits

* [MkDocs](https://www.mkdocs.org/)
* [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)

## License

This library is licensed under the Apache License, Version 2.0. See the LICENSE file.
