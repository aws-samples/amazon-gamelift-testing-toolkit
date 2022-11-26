import {PlayerMatches} from "../Elements/PlayerMatches";
import {SceneDestination} from "../Elements/Player";
import {ScreenResolution} from "../Data/ScreenResolution";
import {Players} from "../Elements/Players";
import {PlayerMatchState} from "../Elements/PlayerMatch";
import {EventDispatcher} from "./EventDispatcher";
import {Events} from "./Events";
import {ConsoleScene} from "../Scenes/ConsoleScene";
import UUID = Phaser.Utils.String.UUID;

export class DummyEventHandler
{
    protected _emitter: EventDispatcher = EventDispatcher.getInstance();
    protected _consoleScene:ConsoleScene;
    
    constructor() {
        this.setupEventListeners();
        this._consoleScene = ConsoleScene.getInstance();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.ADD_DUMMY_FLEET, this.onAddDummyFleet);
        this._emitter.on(Events.ADD_DUMMY_PLAYER, this.onAddDummyPlayer);
        this._emitter.on(Events.ADD_DUMMY_INSTANCE, this.onAddDummyInstance);
        this._emitter.on(Events.ADD_DUMMY_MATCHMAKING_CONFIG, this.onAddDummyMatchmakingConfig);
        this._emitter.on(Events.ADD_DUMMY_QUEUE, this.onAddDummyQueue);
        this._emitter.on(Events.ADD_DUMMY_ANIMATIONS, this.onAddDummyAnimations);
        this._emitter.on(Events.ADD_DUMMY_MATCH, this.onAddDummyMatch);
        this._emitter.on(Events.ADD_DUMMY_PLAYER_TO_MATCH, this.onAddDummyPlayerToMatch);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.ADD_DUMMY_FLEET, this.onAddDummyFleet);
        this._emitter.off(Events.ADD_DUMMY_PLAYER, this.onAddDummyPlayer);
        this._emitter.off(Events.ADD_DUMMY_INSTANCE, this.onAddDummyInstance);
        this._emitter.off(Events.ADD_DUMMY_MATCHMAKING_CONFIG, this.onAddDummyMatchmakingConfig);
        this._emitter.off(Events.ADD_DUMMY_QUEUE, this.onAddDummyQueue);
        this._emitter.off(Events.ADD_DUMMY_ANIMATIONS, this.onAddDummyAnimations);
        this._emitter.off(Events.ADD_DUMMY_MATCH, this.onAddDummyMatch);
        this._emitter.off(Events.ADD_DUMMY_PLAYER_TO_MATCH, this.onAddDummyPlayerToMatch);
    }

    onAddDummyMatch = () =>
    {
        let match = PlayerMatches.createMatch(this._consoleScene, "dummymatch", "arn:aws:gamelift:eu-west-1:12345678:gamesessionqueue/Dummy-Queue");
        this._consoleScene.add.existing(match);
        match.x = 800;
        match.y = 100;
    };

    onAddDummyPlayerToMatch = () =>
    {
        let player = this._consoleScene.addPlayer();
        PlayerMatches.getMatch("dummymatch").addPlayerToMatch(player.PlayerId);
    };

    onAddDummyPlayer = () =>
    {
        this._consoleScene.addPlayer();
    };

    onAddDummyAnimations = async () =>
    {
        while(1)
        {
            let player = this._consoleScene.addPlayer(UUID());
            let player2 = this._consoleScene.addPlayer(UUID());
            let eventPlayerIds=[player.PlayerId, player2.PlayerId];

            let numMatchmakers = this._consoleScene.getMatchmakingConfigurations().ChildElements.length;
            let matchmakingConfig = this._consoleScene.getMatchmakingConfigurations().ChildElements[Math.floor(Math.random()*numMatchmakers)];
            let matchmakerDestination:SceneDestination = {
                container: matchmakingConfig,
                type: "queue",
                delay:1000,
                disappearAfter:false,
            };
            player.addDestination(matchmakerDestination);
            player2.addDestination(matchmakerDestination);

            let matchId=UUID();
            let match = this._consoleScene.initializeMatch(matchId, matchmakingConfig.Data.ConfigurationArn);

            let numQueues = this._consoleScene.getQueues().ChildElements.length;
            let queue = this._consoleScene.getQueues().ChildElements[Math.floor(Math.random()*numQueues)];

            eventPlayerIds.map((playerId)=> // make players move to match destination and then get added to the match
            {
                let matchDestination: SceneDestination = {
                    type: "match",
                    container: match,
                    delay: Math.random()*3000,
                    callback: () => {
                        match.addPlayerToMatch(playerId);

                        if (PlayerMatches.getMatch(matchId).playerIds.length == eventPlayerIds.length) // once all the players are added to match, match is full, move to queue
                        {
                            Players.getPlayer(playerId).storeEvent("MATCH IS FULL");
                            let queueDestination:SceneDestination = {
                                container: queue,
                                type: "queue",
                                delay:1000,
                                disappearAfter:false,
                                callback: () =>
                                {
                                    PlayerMatches.getMatch(matchId).matchState = PlayerMatchState.READY_FOR_PLACEMENT;

                                    let instanceDestination:SceneDestination = null;
                                    let instances=[];
                                    this._consoleScene.getFleets().ChildElements.map(fleet=>
                                    {
                                        fleet.ChildElements.map(instance=>
                                        {
                                            instances.push(instance);
                                        });
                                    });

                                    let instance = instances[Math.floor(Math.random()*instances.length)];
                                    if (instance)
                                    {
                                        instanceDestination = {
                                            container: instance,
                                            type: "instance",
                                            disappearAfter: true,
                                            delay:1000,
                                        };
                                    }
                                    else
                                    {
                                        instanceDestination = {
                                            x:300,
                                            y:ScreenResolution.height-50,
                                            type: "fallback",
                                            disappearAfter: true,
                                            delay:1000,
                                        };
                                    }
                                    match.instanceDestination=instanceDestination;
                                    match.moveToDestination(match.instanceDestination);
                                },
                            };

                            match.queueDestination=queueDestination;

                        } else {
                            Players.getPlayer(playerId).storeEvent("MATCH NOT FULL YET - EXPECTING " + PlayerMatches.getMatch(matchId).playerIds.length + " BUT GOT " + eventPlayerIds.length);
                        }
                    }
                }
                Players.getPlayer(playerId).addDestination(matchDestination);
            });


            await new Promise(r => setTimeout(r, Math.ceil(Math.random()*500)+200));
        }
    };

    onAddDummyFleet = (numInstances=10) =>
    {
        numInstances = Math.ceil(Math.random()*20);
        if (numInstances<5)
        {
            numInstances=3;
        }
        this._consoleScene.disableUpdates=true;
        let fleetId = Phaser.Utils.String.UUID();
        this._consoleScene.getFleets().addFleet(fleetId, true);
        for (let i=0;i<numInstances;i++)
        {
            this.onAddDummyInstance(fleetId);
        }
    };

    onAddDummyMatchmakingConfig = () =>
    {
        this._consoleScene.getMatchmakingConfigurations().addConfig(Phaser.Utils.String.UUID(), true);
    };

    onAddDummyQueue = () =>
    {
        this._consoleScene.getQueues().addGameSessionQueue(Phaser.Utils.String.UUID(), true);
    };

    onAddDummyInstance = (fleetId=null) =>
    {
        if (fleetId==null)
        {
            fleetId = Object.keys(this._consoleScene.getFleets().Fleets)[0];
        }
        this._consoleScene.getFleets().Fleets[fleetId].addInstance(Phaser.Utils.String.UUID(), true);
    };
}