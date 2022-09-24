# Toolkit components

The solution is split into two main parts, the _Management console_, providing various test capabilities, and the optional _Sample game_, providing a headless multi-player game for testing.

## Management console 

The console provides various features for testing games with GameLift. It is split into a number of components.

### UI

A simple web interface to configure and control testing. You use the console to configure GameLift, and then create virtual players who are matched with other virtual players before joining game server sessions.

The interface is designed to simplify interacting with GameLift, allowing you to quickly test different match-making and fleet designs, and ensure GameLift is properly tuned for your game.

The UI is implemented as a static website built with [Phaser](https://phaser.io/). The site is hosted in an Amazon S3 bucket which can be accessed through an Amazon CloudFront distribution. User access control is provided by an Amazon Cognito [user pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html).

### Management services and data

The web console&#39;s functionality is provided by the management services. The services consist of an API Gateway WebSocket API, which uses [IAM authorization](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-control-access-iam.html) for access control and then calls a .NET Core 3.1 Lambda function.

The Lambda function stores WebSocket connection details in a DynamoDB connections table. It then handles a variety of messages from the web console, interacting with a number of resources.

Integrates with GameLift to retrieve game server information, such as fleet details and player sessions, to manage matchmaking, and to retrieve [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) logs.

The DynamoDB tables store the service&#39;s state data, and include a cache of recent GameLift state such as queue events, matchmaking tickets, and game session details.

Launches and terminates virtual players by calling Amazon ECS.

### GameLift listener

The GameLift listener is responsible for listening to GameLift event notifications and keeping the management services up-to-date.

The listener defines an Amazon EventBridge management service [event bus](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-bus.html) and subscribes to GameLift matchmaking and queue placement events using [rules](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rules.html). The events are then published to the management services by inserting event data in the corresponding DynamoDB tables.

In addition, there&#39;s an AWS Step Function that regularly calls GameLift, checks its current state, and removes any out-of-date data from the management services&#39; DynamoDB tables.

## Sample game

To get started quickly, the toolkit includes an optional sample game, a basic multi-player game allowing you to test GameLift before integrating your game with GameLift.

### Game servers

The sample game is a basic .NET game called _NumbersQuiz_, which pits two players against each other, scoring points by answering arithmetic questions.

A Linux build of the game server is uploaded to GameLift as a [custom server build](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-build-cli-uploading.html), and a couple of On-Demand and Spot [fleets](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-ec2-instances.html) are created for hosting games. Finally, a simple matchmaking ruleset is created to enable match-making.

### Virtual players

Virtual players are created by the management services to test the game. Virtual players run as a scripted game client that connects to the Game client services for matchmaking, and then connects to a GameLift game server to play the game.

The virtual player client is installed in a docker image, which is uploaded to a private repository in [Amazon Elastic Container Registry](https://aws.amazon.com/ecr/) (Amazon ECR). An Amazon ECS Fargate cluster is also created, along with a [task definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html) referencing the docker image.

The management service can only run task definitions that have a tag called *AmazonGameLiftTestingToolkit-VirtualPlayers* with a value of	*true*, restricting its access to ECS task defintions in your account.

When the management service creates new virtual players, it sends requests to ECS to create new tasks, with each task running a container with the game client for a single virtual player. The tasks all run within an [Amazon Virtual Private Cloud](https://aws.amazon.com/vpc/) (Amazon VPC).

### Game client services

When a virtual player wants to join a game, the game client calls the game client services to request matchmaking, which matches the virtual player with another player, and replies with details of the GameLift server.

Matchmaking runs in two phases. Firstly, the game client starts matchmaking by sending a request to an API Gateway WebSocket API. The API forwards the request to a Lambda function that calls GameLift and stores the matchmaking ticket in a DynamoDB table. Secondly, once the GameLift listener receives a matchmaking completion event, it calls a Lambda function to update the ticket information in DynamoDB, and tells API Gateway to send the game server information to the clients matched in the ticket.