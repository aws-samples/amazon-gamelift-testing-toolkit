# Using the toolkit

Interaction with the toolkit is predominantly through its web console, which can be accessed once deployed as described in [Quick start](quick_start.md#first-time-login).

The web console contains two distinct parts: the action menu and the main screen. The action menu provides features to configure or control the toolkit and GameLift, while the main screen visualises the AWS account's GameLift resources, and allows adjusting some of the resources' configuration.

If you deployed the toolkit in an account without any GameLift resources, then the main screen will be empty. You can by update the toolkit to include the sample game as described in [Quick start](quick_start.md#deployment).

## Actions menu

The actions menu provides options to interact with virtual players and [Amazon GameLift FlexMatch](https://docs.aws.amazon.com/gamelift/latest/flexmatchguide/match-intro.html). 

Virtual players are launched using Amazon ECS Fargate tasks. Creating virtual players for a game requires packaging a headless game client in a docker container, as described in [Testing your game](testing_your_game.md), although the sample game comes with its own virtual player container.

FlexMatch is a customizable matchmaking service that allows you to build custom rules to defines what a multiplayer match looks like for your game.

The toolkit's specific actions include:

* *Launch Virtual Players*.  Allows launching virtual players, selecting the ECS task to use, the number of players to launch, and whether the players should launch in one go or continuously over a period of time.

* *Manage Virtual Players*. Shows a searchable list of all running virtual players, and allows players to be shut down. 

* *Manage FlexMatch Rulesets*. Shows a list of configured FlexMatch rulesets, allowing you to copy, edit, validate and delete Rulesets.

* *FlexMatch Simulator*. Allows testing FlexMatch Rulesets by creating dummy players and running a simulated matchmaking session.

* *Logout*. Logs you out of the web console.

## Main screen

The main screen allows you to view and interact with the GameLift resources deployed in the same AWS account as the toolkit. 

It is split into three sections and shows the animated flow of players as they move from matchmaking into [GameLift queues](https://docs.aws.amazon.com/gamelift/latest/developerguide/queues-intro.html), before joining games on fleet server instances.

> **Tip:** You can disable animations by clicking the player icon in the console's top-left.

You can also use each of the sections to view and modify the configuration for GameLift's various resources.

### Matchmaking configurations

Shows the currently configured FlexMatch matchmaking configurations. Clicking on the title shows the matchmaking configuration, and clicking on the cog provides various matchmaking options:

- *View Tickets* shows a searchable list of matchmaking tickets, allowing you to drill down into the events associated with the ticket, and also the queue event if the ticket resulted in a queue placement.
- *Modify Config* allows changing the ruleset associated with the matchmaking configuration.
- *View Metrics* shows a variety of matchmaking statistics.

### Queues

Shows the GameLift queues. Clicking on the title shows the queue configuration, and clicking on the cog provides various matchmakqueue options:

- *View Queue Events* to see a searchable list of queue placement events, including the associated matchmaking tickets.
- *View Metrics* shows a variety of queue statistics.

### Fleets

Shows the GameLift fleets, including the number of instances in each fleet. Clicking on the title shows the fleet configuration, clicking on an instance's server icon shows the instance's details, and clicking on the cog provides various fleet options:

 - *View Fleet Events* shows a searchable list of fleet events, and allows you to retrieve logs for events with logs.
 - *View Metrics* shows a variety of fleet statistics.
 - *View Game Session Log* shows a searchable list of game sessions, including associated player sessions and logs.
 - *Modify Locations* allows configuration of the fleet's remote locations, determining where instances can be deployed to host game sessions.
 - *Adjust Scaling* allows the fleet's capacity and scaling settings to be viewed and updated.

