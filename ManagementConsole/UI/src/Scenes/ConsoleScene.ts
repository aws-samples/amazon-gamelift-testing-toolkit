// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {Player, PlayerState, SceneDestination} from "../Elements/Player";
import {Fleets} from "../Elements/Fleets";
import {Network} from "../Network/Network"
import {DataTypes} from "../Data/DataTypes";
import State = DataTypes.State;
import {SettingsPanel} from "../Elements/Settings/SettingsPanel";
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import {SettingsButton} from "../Elements/Buttons/SettingsButton";
import UUID = Phaser.Utils.String.UUID;
import {MatchmakingConfigs} from "../Elements/MatchmakingConfigs";
import {GameSessionQueues} from "../Elements/GameSessionQueues";
import {Players} from "../Elements/Players";
import {PopupHandler} from "../Elements/Popups/PopupHandler";
import {MatchmakingConfig} from "../Elements/MatchmakingConfig";
import {GameSessionQueue} from "../Elements/GameSessionQueue";
import Alias = DataTypes.Alias;
import {ToggleAnimationButton} from "../Elements/Buttons/ToggleAnimationButton";
import {PlayerMatches} from "../Elements/PlayerMatches";
import Sprite = Phaser.GameObjects.Sprite;
import {Fleet} from "../Elements/Fleet";
import {ScreenResolution} from "../Data/ScreenResolution";
import {PlayerMatch} from "../Elements/PlayerMatch";
import {MessageHandler} from "../Network/MessageHandler";
import {GameLiftEventHandler} from "../Events/GameLiftEventHandler";

export class ConsoleScene extends Phaser.Scene
{
    protected _fleets:Fleets;
    protected _matchmakingConfigurations:MatchmakingConfigs;
    protected _queues:GameSessionQueues;
    protected _settingsPanel: SettingsPanel;
    protected _settingsButton: SettingsButton;
    protected _animationButton: ToggleAnimationButton;
    protected _emitter: EventDispatcher;
    protected _lines: Phaser.GameObjects.GameObject[];
    protected _aliases: Alias[];
    protected _gtLogo: Sprite;
    public static animationsEnabled=true;
    protected _disableUpdates=false;
    public stateLoaded:boolean = false;
    public static moveSpeed:number = 3;
    protected _currentState: State;
    protected static instance:ConsoleScene;

    constructor ()
    {
        super("Console");
        this._emitter = EventDispatcher.getInstance();
        new GameLiftEventHandler();
        new MessageHandler();
        PopupHandler.registerScene(this);
        ConsoleScene.instance = this;
    }

    static getInstance() {
        if (ConsoleScene.instance == null) {
            ConsoleScene.instance = new ConsoleScene();
        }
        return ConsoleScene.instance;
    }

    init(state:State)
    {
        ScreenResolution.updateUserResolution(this.scale.width, this.scale.height);

        this._settingsPanel = new SettingsPanel(this, 0, 0);
        this.add.existing(this._settingsPanel);

        this._matchmakingConfigurations = new MatchmakingConfigs(this, 0, 0, ScreenResolution.width);
        this._queues = new GameSessionQueues(this, 0, 0, ScreenResolution.width);
        this._fleets = new Fleets(this, 0, 0, ScreenResolution.width);

        this.add.existing(this._fleets);
        this.add.existing(this._queues);
        this.add.existing(this._matchmakingConfigurations);

        this.layoutScene();

        this.processState(state);
        this._lines = [];

        window.setInterval(()=>
        {
            let players= Players.getPlayers();

            let now = Date.now();

            players.map((player)=>
            {
                let secondsSinceLastSeen = (now- player.lastSeen) / 1000;
                if (secondsSinceLastSeen>=30 && (player.playerState==PlayerState.RESET || player.playerState==PlayerState.CREATED))
                {
                    Players.removePlayer(player.PlayerId);
                }
                else
                if (secondsSinceLastSeen>=300 && player.playerState==PlayerState.WAITING_FOR_MATCH)
                {
                    Players.removePlayer(player.PlayerId);
                }
            });
        }, 5000);
    }

    layoutScene()
    {
        this._queues.x=0;
        this._fleets.x=0;
        this._fleets.y=ScreenResolution.height - this._fleets.displayHeight - 10;
        this._queues.y=this._fleets.y - this._queues.displayHeight - 50;
        this._matchmakingConfigurations.y=this._queues.y - this._matchmakingConfigurations.displayHeight - 50;
    }

    getMatchmakingConfigurations():MatchmakingConfigs
    {
        return this._matchmakingConfigurations;
    }

    getQueues():GameSessionQueues
    {
        return this._queues;
    }

    getFleets():Fleets
    {
        return this._fleets;
    }

    addPlayer(playerId:string=null)
    {
        console.log("ADD PLAYER", playerId);
        let fakePlayer:boolean = false;
        if (playerId==null)
        {
            playerId = UUID();
            fakePlayer=true;
        }
        let player = Players.getPlayer(playerId);
        if (player==undefined)
        {
            player = new Player(this, 0, 0, playerId);
        }

        player.alpha=1;

        if (player.added==false)
        {
            console.log("CREATE PLAYER", playerId, player);
            Players.addPlayer(player);
            player.playAnimation("down");
            player.stopAnimation();
            player.x = 400;
            player.y = 30;

            Players.setClearXPos(player, 400, 1000);
            player.initialX = player.x;
            player.initialY = player.y;
            this.add.existing(player);

            if (fakePlayer)
            {
                let config = this._matchmakingConfigurations.ChildElements[0];
                let destination:SceneDestination = {
                    container: config,
                    type: "matchmakingConfig",
                    disappearAfter:false,
                    delay:0,
                };
                //player.addDestination(destination);
                //player.moveToContainer(instance, true,2000);
            }
        }

        return player;
    }

    initializeMatch = (matchId:string, configArn:string=null):PlayerMatch =>
    {
        let match = PlayerMatches.getMatch(matchId);

        // if match doesn't exist yet, then create it
        if (match==undefined)
        {
            console.log("CREATING MATCH", matchId);
            match = PlayerMatches.createMatch(this, matchId);
            this.add.existing(match);
        }

        // if matchmaking config Arn is set, then update match
        if (configArn!=null)
        {
            let matchmakingConfig = this._matchmakingConfigurations.getConfigByArn(configArn);
            match.x = matchmakingConfig.x + Math.floor(Math.random() * matchmakingConfig.displayWidth);
            if (ScreenResolution.displayResolution==ScreenResolution.RES_720P)
            {
                match.y = 220;
            }
            else
            {
                match.y = 375;
            }
            match.configArn = configArn;
        }

        return match;
    }

    processState(state:State)
    {
        this._currentState = state;

        if (state!=null)
        {
            if (state.MatchmakingConfigurations && state.MatchmakingConfigurations.length)
            {
                for (let mmConfig of state.MatchmakingConfigurations)
                {
                    this._matchmakingConfigurations.updateConfig(mmConfig);
                }
            }

            if (state.GameSessionQueues && state.GameSessionQueues.length) {
                for (let queue of state.GameSessionQueues) {
                    this._queues.updateQueue(queue);
                }
            }

            if (state.FleetData && state.FleetData.length) {
                for (let fleetData of state.FleetData) {
                    this._fleets.updateFleet(fleetData);
                }

                this._fleets.removeDeletedFleets(state.FleetData);
            }

            if (state.Aliases && state.Aliases.length)
            {
                this._aliases = state.Aliases;
            }

            this.stateLoaded=true;
        }
    }

    create ()
    {
        ScreenResolution.updateUserResolution(this.scale.width, this.scale.height);
        this.cameras.main.setBackgroundColor("#161925");

        this._settingsButton = new SettingsButton(this, 0, 0);
        this._settingsButton.scale=0.5;
        this._settingsButton.x = this._settingsButton.displayWidth/2 + 5;
        this._settingsButton.y = this._settingsButton.displayHeight/2 + 5;
        this.add.existing(this._settingsButton);

        this._animationButton = new ToggleAnimationButton(this, 0, 50, ConsoleScene.animationsEnabled);
        this._animationButton.scale=0.4;
        this._animationButton.x = this._settingsButton.x + this._settingsButton.displayWidth + 10;
        this._animationButton.y = this._settingsButton.y;
        this.add.existing(this._animationButton);

        this._gtLogo = this.add.sprite(0,0,"toolkit", "gtlogo.png");
        this._gtLogo.scale = 0.5;
        this._gtLogo.setOrigin(0);
        this._gtLogo.x = ScreenResolution.width - this._gtLogo.displayWidth - 3;
        this._gtLogo.y = 0;

        this.setupEventListeners();

        this.input.on("pointerdown", this.onSceneClick);
    }

    setupEventListeners = () =>
    {
        this._emitter.on(Events.STATE_UPDATE, this.onStateMessage);
        this._emitter.on(Events.OPEN_SETTINGS, this.onSettingsOpen);
        this._emitter.on(Events.ENABLE_ANIMATIONS, this.onEnableAnimations);
        this._emitter.on(Events.DISABLE_ANIMATIONS, this.onDisableAnimations);
        this._emitter.on(Events.CLOSE_SETTINGS, this.onSettingsClose);
        this._emitter.on(Events.LAUNCH_PLAYERS, this.onLaunchPlayers);
        this._emitter.on(Events.ADD_FAKE_FLEET, this.onAddFakeFleet);
        this._emitter.on(Events.ADD_BIG_PLAYER, this.onAddBigPlayer);
        this._emitter.on(Events.ADD_FAKE_PLAYER, this.onAddFakePlayer);
        this._emitter.on(Events.ADD_FAKE_INSTANCE, this.onAddFakeInstance);
        this._emitter.on(Events.ADD_FAKE_GAME_SESSION, this.onAddFakeGameSession);
        this._emitter.on(Events.ADD_FAKE_MATCHMAKING_CONFIG, this.onAddFakeMatchmakingConfig);
        this._emitter.on(Events.ADD_FAKE_QUEUE, this.onAddFakeQueue);
        this._emitter.on(Events.ADD_FAKE_ANIMATIONS, this.onAddFakeAnimations);
        this._emitter.on(Events.ADD_FAKE_MATCH, this.onAddFakeMatch);
        this._emitter.on(Events.ADD_FAKE_PLAYER_TO_MATCH, this.onAddFakePlayerToMatch);
        this._emitter.on(Events.SHOW_MATCHMAKING_CONFIG_QUEUES, this.onShowMatchmakingConfigQueues);
        this._emitter.on(Events.HIDE_MATCHMAKING_CONFIG_QUEUES, this.onHideLines);
        this._emitter.on(Events.SHOW_QUEUE_FLEETS, this.onShowQueueFleets);
        this._emitter.on(Events.HIDE_QUEUE_FLEETS, this.onHideLines);
        this._emitter.on(Events.PLAYER_ADDED_TO_GAME_SESSION, this.onPlayerAddedToGameSession);
    };

    onStateMessage = (stateMessage) =>
    {
        if (this._disableUpdates==false)
        {
            this.processState(stateMessage.State);
        }
    }

    onPlayerAddedToGameSession = (playerId) =>
    {
        Players.removePlayer(playerId);
    }

    onEnableAnimations = () =>
    {
        ConsoleScene.animationsEnabled=true;
        Players.showPlayers();
        PlayerMatches.showMatches();
        this._fleets.redrawFleets();
    }

    onDisableAnimations = () =>
    {
        ConsoleScene.animationsEnabled=false;
        Players.hidePlayers();
        PlayerMatches.hideMatches();
        this._fleets.redrawFleets();
    }

    onShowMatchmakingConfigQueues = (matchmakingConfig:MatchmakingConfig) =>
    {
        const matchmakingConfigWorldTranslation = matchmakingConfig.getWorldTranslation();
        matchmakingConfig.Data.GameSessionQueueArns.map((queueArn)=>
        {
            const queue = this._queues.getQueueByArn(queueArn);
            if (queue!=null)
            {
                const queueWorldTranslation = queue.getWorldTranslation();

                const startX = matchmakingConfigWorldTranslation["translateX"] + matchmakingConfig.displayWidth/2;
                const startY = matchmakingConfigWorldTranslation["translateY"] + matchmakingConfig.displayHeight;
                const endX = queueWorldTranslation["translateX"] + queue.displayWidth/2;
                const endY = queueWorldTranslation["translateY"];

                this.drawArrow(startX, startY, endX, endY, 0xffffff, 20);
            }
        })
    };

    onShowQueueFleets = (queue:GameSessionQueue) =>
    {
        const queueWorldTranslation = queue.getWorldTranslation();
        const fleets=[];
        queue.Data.Destinations.map((destination)=> {
            if (destination.DestinationArn.indexOf("alias") !== -1) {
                this._aliases.map((alias) => {
                    fleets.push(this._fleets.getFleetById(alias.RoutingStrategy.FleetId));
                })
            } else {
                fleets.push(this._fleets.getFleetByArn(destination.DestinationArn));
            }
        });

        fleets.map((fleet)=>
        {
            const fleetWorldTranslation = fleet.getWorldTranslation();

            const startX = queueWorldTranslation["translateX"] + queue.displayWidth/2;
            const startY = queueWorldTranslation["translateY"] + queue.displayHeight;
            const endX = fleetWorldTranslation["translateX"] + fleet.displayWidth/2;
            const endY = fleetWorldTranslation["translateY"];

            this.drawArrow(startX, startY, endX, endY, 0xffffff, 20);
        });
    };

    drawArrow(startX:number, startY:number, endX:number, endY:number, color:number=0xff0000, pointerLineLength:number=10)
    {
        const triangleSize = 15;
        const line = this.add.line(
            0,
            0,
            startX,
            startY,
            endX,
            endY,
            color
        ).setOrigin(0, 0);

        let startEndRadians = Math.atan((endY - startY) / (endX - startX)) + ((endX - startX) < 0 ? Math.PI : 0);

        line.alpha=1;
        this._lines.push(line);

        const r7 = this.add.triangle(endX, endY, 0, 0, triangleSize, triangleSize, 0, triangleSize*2, color).setOrigin(1, 0.5);
        r7.rotation=startEndRadians;
        r7.alpha=1;

        this._lines.push(r7);
    }

    onHideLines = () =>
    {
        this._lines?.map((line)=>
        {
            line.destroy();
        });

        this._lines=[];
    };


    onSettingsOpen = () =>
    {
        this._settingsPanel.show();
        this._settingsButton.disable();
    };

    onSettingsClose = () =>
    {
        this._settingsPanel.hide();
        this._settingsButton.enable();
    };

    onAddFakeMatch = () =>
    {
        let match = PlayerMatches.createMatch(this, "joetest", "joetest");
        this.add.existing(match);
        match.x = 800;
        match.y = 100;
    };

    onAddFakePlayerToMatch = () =>
    {
        let player = this.addPlayer();
        PlayerMatches.getMatch("joetest").addPlayerToMatch(player.PlayerId);
    };

    onAddFakePlayer = () =>
    {
        this.addPlayer();
    };

    onAddBigPlayer = () =>
    {
        let player = this.addPlayer();
        player.scale = 20;
    };

    onAddFakeAnimations = async () =>
    {
        while(1)
        {
            let player = this.addPlayer(UUID());
            let player2 = this.addPlayer(UUID());
            let eventPlayerIds=[player.PlayerId, player2.PlayerId];

            let numMatchmakers = this._matchmakingConfigurations.ChildElements.length;
            let matchmakingConfig = this._matchmakingConfigurations.ChildElements[Math.floor(Math.random()*numMatchmakers)];
            let matchmakerDestination:SceneDestination = {
                container: matchmakingConfig,
                type: "queue",
                delay:1000,
                disappearAfter:false,
            };
            player.addDestination(matchmakerDestination);
            player2.addDestination(matchmakerDestination);

            let matchId=UUID();

            let match = PlayerMatches.createMatch(this, matchId, matchmakingConfig.Data.ConfigurationArn);
            match.x = matchmakingConfig.x + Math.floor(Math.random() * matchmakingConfig.displayWidth);
            if (ScreenResolution.displayResolution==ScreenResolution.RES_1080P)
            {
                match.y = this._queues.y - 15;
            }
            else
            {
                match.y = this._queues.y - 15;
            }
            this.add.existing(match);

            let numFleets = this._fleets.ChildElements.length;
            let numQueues = this._queues.ChildElements.length;
            let queue = this._queues.ChildElements[Math.floor(Math.random()*numQueues)];
            let fleet = this._fleets.ChildElements[Math.floor(Math.random()*numFleets)];
            let numInstances = fleet.ChildElements.length;
            let instance = fleet.ChildElements[Math.floor(Math.random()*numInstances)];

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
                            PlayerMatches.getMatch(matchId).moveToNextDestination();
                        } else {
                            Players.getPlayer(playerId).storeEvent("MATCH NOT FULL YET - EXPECTING " + PlayerMatches.getMatch(matchId).playerIds.length + " BUT GOT " + eventPlayerIds.length);
                        }

                        let queueDestination:SceneDestination = {
                            container: queue,
                            type: "queue",
                            delay:1000,
                            disappearAfter:false,
                        };
                        match.addDestination(queueDestination);

                        let instanceDestination:SceneDestination = {
                            container: instance,
                            type: "instance",
                            disappearAfter: true,
                            delay:1000,
                        };
                        match.addDestination(instanceDestination);
                    }
                }
                Players.getPlayer(playerId).addDestination(matchDestination);
            });

            await new Promise(r => setTimeout(r, Math.ceil(Math.random()*500)+200));
        }
    };

    onLaunchPlayers = (event) =>
    {
        Network.sendObject({"Type":"LaunchPlayers", "NumPlayers":parseInt(event.numPlayers), "TaskDefinitionArn":event.taskDefinitionArn, "CapacityProvider":event.capacityProvider});
    };

    onAddFakeFleet = (numInstances=10) =>
    {
        numInstances = Math.ceil(Math.random()*20);
        if (numInstances<5)
        {
            numInstances=3;
        }
        this._disableUpdates=true;
        let fleetId = Phaser.Utils.String.UUID();
        this._fleets.addFleet(fleetId, true);
        for (let i=0;i<numInstances;i++)
        {
            this.onAddFakeInstance(fleetId);
        }
    };

    onAddFakeMatchmakingConfig = () =>
    {
        this._matchmakingConfigurations.addConfig(Phaser.Utils.String.UUID(), true);
    };

    onAddFakeQueue = () =>
    {
        this._queues.addGameSessionQueue(Phaser.Utils.String.UUID(), true);
    };

    onAddFakeInstance = (fleetId=null) =>
    {
        if (fleetId==null)
        {
            fleetId = Object.keys(this._fleets.Fleets)[0];
        }
        this._fleets.Fleets[fleetId].addInstance(Phaser.Utils.String.UUID(), true);
    };

    onAddFakeGameSession = () =>
    {
        let fleetId = Object.keys(this._fleets.Fleets)[0];
        this._fleets.Fleets[fleetId].addGameSession(Phaser.Utils.String.UUID(), true);
    };

    onSceneClick = (pointer, localX, localY, event)  =>
    {
        this._emitter.emit(Events.CLOSE_POPUP);
        this._emitter.emit(Events.CLOSE_MENUS);
    };

    doResize = (gameSize, baseSize, displaySize, resolution) =>
    {
        ScreenResolution.updateUserResolution(this.scale.width, this.scale.height);

        this._gtLogo.x = ScreenResolution.width - this._gtLogo.displayWidth - 3;
        this._gtLogo.y = 0;

        this._matchmakingConfigurations.resize(ScreenResolution.width, MatchmakingConfig.configHeight);
        this._queues.resize(ScreenResolution.width, GameSessionQueue.queueHeight);
        this._fleets.resize(ScreenResolution.width, Fleet.fleetHeight);
        this.layoutScene();
    }
}