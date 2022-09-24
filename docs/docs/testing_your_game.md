# Testing your game

The Amazon GameLift Testing Toolkit allows you to test your own games, although it also comes with a sample game, allowing you to experiment with the toolkit before integrating it with your own game. If you are integrating the toolkit with your own game, you might prefer not to install the sample game, which is described in the installation section.

Since the toolkit integrates directly with Amazon GameLift, once you&#39;ve integrated your game with GameLift then many of the toolkit&#39;s features will work out of the box.

- Web console, displaying a dashboard of your GameLift deployment
- Fleet scaling configuration, allowing fleets to be scaled up and down
- Match-making management, allowing match-making rules to be configured and tested

However, to use the toolkit for testing your game at scale you need a mechanism to manage virtual players.

## Externally managed virtual players

If you already have a test harness for creating and administering virtual players, or if you have real test players, you can manage players outside of the toolkit.

The options for managing virtual players in the web console will be disabled, but you can use the remainder of the toolkit&#39;s features as described in the web console section.

## Toolkit managed virtual players

The web console contains various features for managing virtual players. It allows a large number of virtual players to be created and deleted, and helps you test your game at scale.

The virtual player management system has an API to control virtual players, which uses Amazon ECS and AWS Fargate to host containers running headless test clients.

To integrate your game with the toolkit&#39;s virtual player management system, you need to do the following:

1. Create a headless game client that connects with your game servers, and can automatically join and play games. The game client could either manage single or multiple player sessions at once, depending on how you decide to script your virtual players.
2. Package your headless game client in a Linux docker image. Since the process for creating and packaging your game client in docker is dependent on your choice of game engine or programming language, we won&#39;t cover it here.
3. Deploy your game server and any backend services.
4. Deploy the Amazon GameLift Testing Toolkit, with or without the test game.
5. Create an Amazon ECS cluster and task definitions to launch the headless game client, ensuring the task defintion has a tag called *AmazonGameLiftTestingToolkit-VirtualPlayers* with a value of	*true*.

Once you&#39;ve packaged your game client in a docker image, you can create an Amazon ECS cluster and task definition to run the virtual players. There are various approaches for creating an ECS cluster, including a [detailed tutorial](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-cli-tutorial-fargate.html) in the AWS Fargate documentation.

Alternatively you could use the Sample game as a starting point, and customize it's CDK deployment scripts to work with your container as follows:

1. Make a copy of the _source/SampleGame/_ directory and give it a new name, for example _TestMyGame_.
2. Delete the _TestMyGame/Backend/_ directory and delete the contents of the _TestMyGame/Game/_ directory.
3. Add your game client&#39;s dockerfile and any associated files to the _TestMyGame/Game/_ directory.
4. Open the _TestMyGame/Infra/src/Program.cs_ file and update the _StackName_ variable with a name to use for your virtual players CloudFormation stack. For example, _TestMyGameVirtualPlayers_.
5. Open the _TestMyGame/Infra/src/Lib/VirtualPlayersStack.cs_ file and update the gameClientCommand variable in the VirtualPlayersStack constructor method with an array of command line arguments for running your game client. The first item is the full path to the game client executable inside the docker container, and the remaining items are the arguments expected by the executable.
6. Deploy the new virtual players stack by running the following command in the _TestMyGame_ directory:

```bash
../node\_modules/.bin/cdk deploy 
```

Once the stack has successfully deployed, you can login and test your game as described in _Using the web console_.