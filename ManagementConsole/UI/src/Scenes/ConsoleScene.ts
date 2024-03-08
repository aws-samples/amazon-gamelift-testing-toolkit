// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {Player, PlayerState, SceneDestination} from "../Elements/Player";
import {Fleets} from "../Elements/Fleets";
import {DataTypes} from "../Data/DataTypes";
import State = DataTypes.State;
import {SettingsPanel} from "../Elements/Settings/SettingsPanel";
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import {SettingsButton} from "../Elements/Buttons/SettingsButton";
import UUID = Phaser.Utils.String.UUID;
import {MatchmakingConfigs} from "../Elements/MatchmakingConfigs";
import {GameSessionQueues} from "../Elements/GameSessionQueues";
import {PlayerManager} from "../Managers/PlayerManager";
import {PopupHandler} from "../Elements/Popups/PopupHandler";
import {MatchmakingConfig} from "../Elements/MatchmakingConfig";
import {GameSessionQueue} from "../Elements/GameSessionQueue";
import Alias = DataTypes.Alias;
import {ToggleAnimationButton} from "../Elements/Buttons/ToggleAnimationButton";
import {MatchManager} from "../Managers/MatchManager";
import Sprite = Phaser.GameObjects.Sprite;
import {Fleet} from "../Elements/Fleet";
import {ScreenResolution} from "../Data/ScreenResolution";
import {PlayerMatch} from "../Elements/PlayerMatch";
import {MessageHandler} from "../Network/MessageHandler";
import {GameLiftEventHandler} from "../Events/GameLiftEventHandler";
import {DummyEventHandler} from "../Events/DummyEventHandler";
import Rectangle = Phaser.Geom.Rectangle;
import DOMElement = Phaser.GameObjects.DOMElement;

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
    protected _scheduleProgressBanner: DOMElement;

    constructor ()
    {
        super("Console");
        ConsoleScene.instance = this;
        this._emitter = EventDispatcher.getInstance();
        new GameLiftEventHandler();
        new MessageHandler();
        new DummyEventHandler();
        PopupHandler.registerScene(this);
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

        this._scheduleProgressBanner = this.add.dom(ScreenResolution.width/2, 30).createFromCache('scheduleProgress');
        this.add.existing(this._scheduleProgressBanner);
        $("div#scheduleProgress").hide();

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
            let players= PlayerManager.getPlayers();

            let now = Date.now();

            players.map((player)=>
            {
                let secondsSinceLastSeen = (now- player.lastSeen) / 1000;
                if (secondsSinceLastSeen>=30 && (player.playerState==PlayerState.RESET || player.playerState==PlayerState.CREATED))
                {
                    PlayerManager.removePlayer(player.PlayerId);
                }
                else
                if (secondsSinceLastSeen>=300 && player.playerState==PlayerState.WAITING_FOR_MATCH)
                {
                    PlayerManager.removePlayer(player.PlayerId);
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

    addPlayer(playerId:string=null):Player
    {
        let fakePlayer:boolean = false;
        if (playerId==null)
        {
            playerId = UUID();
            fakePlayer=true;
        }
        let player = PlayerManager.getPlayer(playerId);
        if (player==undefined)
        {
            player = new Player(this, 0, 0, playerId);
        }

        player.alpha=1;

        if (player.added==false)
        {
            PlayerManager.addPlayer(player);
            player.playAnimation("down");
            player.stopAnimation();
            player.x = 400;
            player.y = 30;

            if (ScreenResolution.displayResolution==ScreenResolution.RES_720P)
            {
                PlayerManager.setClearXPos(player, 200, 1000);
            }
            else
            {
                PlayerManager.setClearXPos(player, 200, 1720);
            }
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
        this._gtLogo.y = 10;

        this.setupEventListeners();

        this.input.on("pointerdown", this.onSceneClick);
    }

    setupEventListeners = () =>
    {
        this._emitter.on(Events.STATE_UPDATE, this.onStateMessage);
        this._emitter.on(Events.OPEN_SETTINGS, this.onSettingsOpen);
        this._emitter.on(Events.SCHEDULE_PROGRESS, this.onScheduleProgress);
        this._emitter.on(Events.ENABLE_ANIMATIONS, this.onEnableAnimations);
        this._emitter.on(Events.DISABLE_ANIMATIONS, this.onDisableAnimations);
        this._emitter.on(Events.CLOSE_SETTINGS, this.onSettingsClose);
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

    public set disableUpdates(val:boolean)
    {
        this._disableUpdates=val;
    }

    onPlayerAddedToGameSession = (playerId) =>
    {
        PlayerManager.removePlayer(playerId);
    }

    onEnableAnimations = () =>
    {
        ConsoleScene.animationsEnabled=true;
        PlayerManager.showPlayers();
        MatchManager.showMatches();
        this._fleets.redrawFleets();
    }

    onDisableAnimations = () =>
    {
        ConsoleScene.animationsEnabled=false;
        PlayerManager.hidePlayers();
        MatchManager.hideMatches();
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

        console.log(fleets);

        fleets.map((fleet)=>
        {
            if (fleet!=null)
            {
                const fleetWorldTranslation = fleet.getWorldTranslation();

                const startX = queueWorldTranslation["translateX"] + queue.displayWidth/2;
                const startY = queueWorldTranslation["translateY"] + queue.displayHeight;
                const endX = fleetWorldTranslation["translateX"] + fleet.displayWidth/2;
                const endY = fleetWorldTranslation["translateY"];

                this.drawArrow(startX, startY, endX, endY, 0xffffff, 20);
            }
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

    onScheduleProgress = (data) =>
    {
        if (data.ActionIndex!=null)
        {
            const action = data.Schedule.Actions[data.ActionIndex];

            let progressText="";
            if (action.Type=="Launch")
            {
                if (action.Status=="Completed")
                {
                    $("div#scheduleProgress").attr("class", "alert alert-success");
                    progressText = action.NumTasks + " task(s) launched!";
                }
                else
                {
                    $("div#scheduleProgress").attr("class", "alert alert-danger");
                    progressText = action.NumTasks + " task(s) failed to launch!";
                }
            }
            else
            {
                if (action.Status=="Completed")
                {
                    $("div#scheduleProgress").attr("class", "alert alert-success");
                    progressText = action.NumTasks + " task(s) terminated!";
                }
                else
                {
                    $("div#scheduleProgress").attr("class", "alert alert-danger");
                    progressText = action.NumTasks + " task(s) failed to terminate!";
                }
            }

            $("div#scheduleProgress").html(progressText);
            $("div#scheduleProgress").show();
            setTimeout(()=>
            {
                $("div#scheduleProgress").hide();
            }, 6000);
        }

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

    onSceneClick = (pointer, localX, localY, event)  =>
    {
        this._emitter.emit(Events.CLOSE_POPUP);
        this._emitter.emit(Events.CLOSE_MENUS);
    };

    doResize = (gameSize, baseSize, displaySize, resolution) =>
    {
        ScreenResolution.updateUserResolution(this.scale.width, this.scale.height);

        this._gtLogo.x = ScreenResolution.width - this._gtLogo.displayWidth - 3;
        this._gtLogo.y = 10;

        this._matchmakingConfigurations.resize(ScreenResolution.width, MatchmakingConfig.configHeight);
        this._queues.resize(ScreenResolution.width, GameSessionQueue.queueHeight);
        this._fleets.resize(ScreenResolution.width, Fleet.fleetHeight);
        this.layoutScene();
    }
}