# Quick Start

Whether you're starting development of a multiplayer game with dedicated servers, or have already written a game using Amazon GameLift, you can quickly get the Amazon GameLift Testing Toolkit deployed and running.

The quickest way to get started is to build and deploy the toolkit and the sample game, and you can then delete the sample game when you no longer need it.

## Prerequisites

* An existing AWS account.
* The [AWS Command Line Interface (CLI)](https://aws.amazon.com/cli/) installed locally.
* [Node.js 16.x](https://nodejs.org/) installed locally, including npm.
* [.NET 5](https://docs.microsoft.com/en-us/dotnet/core/install/) installed locally.
* A local copy of the toolkit source code.

Additionally, if you intend to deploy the sample game or create virtual players you will also need:

* [Docker](https://www.docker.com/) installed and you should be logged in to Docker Hub.

## Build

Once you have met the prequisites, building the toolkit takes a few minutes. You can build the toolkit by opening a terminal window, navigating to the toolkit's `source` directory, and running the following commands:

```bash
dotnet tool install -g Amazon.Lambda.Tools
sudo npm install --global yarn
yarn
yarn build-toolkit
```

Optionally, if you also want to deploy the sample game you should run the following command: 

```bash
yarn build-sample-game
```

## Deployment

Once you've built the toolkit you're ready to deploy to your AWS account, although be aware that deploying the toolkit to AWS will incure [costs](additional_resources.md#costs) based on your usage. Deploying the toolkit should take roughly 15 minutes, but prior to deploying the toolkit you should familiarize yourself with the [AWS services](aws_services.md) deployed by the toolkit. 

If you have configured the AWS CLI with multiple profiles you can pass in a name to choose which profile to target. 

```bash
yarn deploy-toolkit [--profile <profileName>]
```

When the deployment succeeds succesfully the terminal will display a number of output variables. Make a note of the value of the `AmazonGameLiftTestingToolkit.CloudfrontDomainName ` variable and the `AmazonGameLiftTestingToolkit.userPoolId` variable, which you will use in the next stage.

Optionally, if you want to deploy the sample game you should run the following command: 

```bash
yarn deploy-sample-game [--profile <profileName>]
```

## First time login

The toolkit uses [Amazon Cognito](https://docs.aws.amazon.com/cognito) to authenticate and authorize access to its web console, so prior to logging in  you will need to create a user in the toolkit's Cognito User Pool. 

1. Login to the *AWS Management Console* and navigate to *Cognito*
2. In the list of *User Pools* select the *User Pool* with the *userPoolId* you previously noted.
3. In the *Users* tab, choose *Create user*.
3. In *Users and groups* select *Create user* and then enter your user details.

Once you've created a user, you can login by navigating to the URL previously noted in the `AmazonGameLiftTestingToolkit.CloudfrontDomainName ` variable.