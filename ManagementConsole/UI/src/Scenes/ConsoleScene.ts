// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {Player, SceneDestination} from "../Elements/Player";
import {Fleets} from "../Elements/Fleets";
import {Network} from "../Network/Network"
import {DataTypes} from "../Data/DataTypes";
import State = DataTypes.State;
import StateMessage = DataTypes.StateMessage;
import {SettingsPanel} from "../Elements/Settings/SettingsPanel";
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import {SettingsButton} from "../Elements/Buttons/SettingsButton";
import UUID = Phaser.Utils.String.UUID;
import {MatchmakingConfigs} from "../Elements/MatchmakingConfigs";
import {GameSessionQueues} from "../Elements/GameSessionQueues";
import FlexMatchEventDetail = DataTypes.FlexMatchEventDetail;
import QueuePlacementEventDetail = DataTypes.QueuePlacementEventDetail;
import {Players} from "../Elements/Players";
import {PopupHandler} from "../Elements/Popups/PopupHandler";
import {MatchmakingConfig} from "../Elements/MatchmakingConfig";
import {GameSessionQueue} from "../Elements/GameSessionQueue";
import Alias = DataTypes.Alias;
import SimpleResult = DataTypes.SimpleResult;
import {ToggleAnimationButton} from "../Elements/Buttons/ToggleAnimationButton";
import {PlayerMatches} from "../Elements/PlayerMatches";
import Sprite = Phaser.GameObjects.Sprite;
import {Fleet} from "../Elements/Fleet";
import {ScreenResolution} from "../Data/ScreenResolution";
import {PlayerMatch} from "../Elements/PlayerMatch";

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
    public static disableUpdates=false;
    protected _stateLoaded:boolean = false;
    public static moveSpeed:number = 3;
    protected _currentState: State;

    constructor ()
    {
        super("Console");
        this._emitter = EventDispatcher.getInstance();
        PopupHandler.registerScene(this);
        console.log(this);
    }

    init(state:State)
    {
        console.log("INIT CALLED", state);
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
    }

    layoutScene()
    {
        this._queues.x=0;
        this._fleets.x=0;
        this._fleets.y=ScreenResolution.height - this._fleets.displayHeight - 10;
        this._queues.y=this._fleets.y - this._queues.displayHeight - 50;
        this._matchmakingConfigurations.y=this._queues.y - this._matchmakingConfigurations.displayHeight - 50;
    }

    addPlayer(playerId:string=null)
    {
        let fakePlayer:boolean = false;
        if (playerId==null)
        {
            playerId = UUID();
            fakePlayer=true;
        }
        let player = Players.getPlayer(playerId);
        console.log("FOUND PLAYER", player);
        if (player==undefined)
        {
            player = new Player(this, 0, 0, playerId);
        }

        player.alpha=1;
        console.log("ADDING PLAYER WITH ID", playerId, player.added);

        if (player.added==false)
        {
            Players.addPlayer(player);
            player.playAnimation("down");
            player.stopAnimation();
            player.x = 400;
            player.y = 30;

            Players.setClearXPos(player, 400, 1000);
            player.initialX = player.x;
            player.initialY = player.y;
            console.log("ADDING PLAYER WITH INITIAL VALUES", player.x, player.y);
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

    processFlexMatchEvent(flexMatchEvent:FlexMatchEventDetail, resources:string[])
    {
        let eventPlayerIds:string[] = [];

        let playerTicketMap: Record<string, string> = {};
        // TODO HANDLE BACKFILL CORRECTLY FOR ADDED PLAYERS
        flexMatchEvent.tickets.map((ticket)=>
        {
            // ADD PLAYERS
            if (!ticket.ticketId.startsWith("auto-backfill"))
            {
                ticket.players.map((player)=>
                {
                    playerTicketMap[player.playerId] = ticket.ticketId;
//                    eventPlayerIds.push(player.playerId);
                    eventPlayerIds.push(player.playerId);
                    this.addPlayer(player.playerId);
                });
            }
        });

        let matchmakingConfig = this._matchmakingConfigurations.getConfigByArn(resources[0]);
        if (matchmakingConfig==null)
        {
            return;
        }

        if (flexMatchEvent.matchId && flexMatchEvent.type == "PotentialMatchCreated") // we have a match
        {
            console.log("RECEIVED " + flexMatchEvent.type + " SO MOVING PLAYERS TO MATCH");
            // construct match
            /*let match = PlayerMatches.createMatch(this, flexMatchEvent.matchId, resources[0]);
            console.log("CREATING MATCH", flexMatchEvent.matchId);
            match.x = matchmakingConfig.x + Math.floor(Math.random() * matchmakingConfig.displayWidth);
            match.y = 375;*/

            let match = this.initializeMatch(flexMatchEvent.matchId, resources[0]);

            eventPlayerIds.map((playerId)=> // make players move to match destination and then get added to the match
            {
                let matchDestination:SceneDestination = {
                    type: "match",
                    container:match,
                    callback: () =>
                    {
                        console.log("ADDING PLAYER TO MATCH:", playerId, flexMatchEvent.matchId);
                        match.addPlayerToMatch(playerId);
                        console.log(PlayerMatches.getMatch(flexMatchEvent.matchId).playerIds);

                        if (PlayerMatches.getMatch(flexMatchEvent.matchId).playerIds.length == eventPlayerIds.length) // once all the players are added to match, move to queue
                        {
                            Players.getPlayer(playerId).storeEvent("MATCH IS FULL");
                            PlayerMatches.getMatch(flexMatchEvent.matchId).moveToNextDestination();
                        }
                        else
                        {
                            Players.getPlayer(playerId).storeEvent("MATCH NOT FULL YET - EXPECTING " + PlayerMatches.getMatch(flexMatchEvent.matchId).playerIds.length + " BUT GOT " + eventPlayerIds.length);
                        }
                    }
                }
                Players.getPlayer(playerId).storeEvent(flexMatchEvent);
                Players.getPlayer(playerId).storeEvent(matchDestination);
                Players.getPlayer(playerId).addDestination(matchDestination);
            });

            return;
        }
        else
        if (flexMatchEvent.type=="MatchmakingSearching") // MatchmakingSearching is the start of a matchmaking cycle, so set player's active ticketId so we can ignore old ticket events
        {
            flexMatchEvent.tickets.map((ticket)=>
            {
                if (!ticket.ticketId.startsWith("auto-backfill"))
                {
                    ticket.players.map((player)=>
                    {
                        Players.getPlayer(player.playerId).activeTicketId = ticket.ticketId;
                    });
                }
            });

            eventPlayerIds.map((playerId)=>
            {
                // break up any match involving these players, if one exists
                let match = PlayerMatches.findPlayerMatch(playerId);
                if (match)
                {
                    console.log("RECEIVED " + flexMatchEvent.type + " AND PLAYER ALREADY IN A MATCH, SO BREAKING UP MATCH");
                    match?.breakUpMatch();
                }

                // send player to matchmaking config
                let destination:SceneDestination = {
                    container: matchmakingConfig,
                    type: "matchmakingConfig",
                    disappearAfter:false,
                    delay:0,
                };
                Players.getPlayer(playerId).addDestination(destination);
                console.log("RECEIVED " + flexMatchEvent.type + " SO SENDING PLAYER " + playerId + " TO MATCHMAKING CONFIG");
            });

            return;
        }

        if (flexMatchEvent.type == "MatchmakingTimedOut" || flexMatchEvent.type == "MatchmakingCancelled")
        {
            eventPlayerIds.map((playerId)=>
            {
                if (Players.getPlayer(playerId).activeTicketId == playerTicketMap[playerId]) // if we have a different type of event, make players go back to the start
                {
                    console.log("RECEIVED " + flexMatchEvent.type + " ON PLAYER'S ACTIVE TICKET, SO SENDING PLAYER BACK TO INITIAL POSITION");
                    Players.getPlayer(playerId).moveToInitialPosition();
                    Players.getPlayer(playerId).resetDestinations();
                }
            });

            return;
        }

        console.log("RECEIVED " + flexMatchEvent.type + " SO DOING NOTHING", flexMatchEvent);
    }

    processQueuePlacementEvent(queuePlacementEvent:QueuePlacementEventDetail, resources:string[])
    {
        let playerIds:string[] = [];
        console.log(queuePlacementEvent.type, queuePlacementEvent);
        if (queuePlacementEvent.placedPlayerSessions==null) // the queue placement has failed for some reason
        {
            console.log("QUEUE PLACEMENT FAILED!", queuePlacementEvent);
            if (queuePlacementEvent.placementId)
            {
                let match = PlayerMatches.getMatch(queuePlacementEvent.placementId); // look up the corresponding match and break it up
                if (match)
                {
                    playerIds = match.playerIds;
                    let configArn = match.configArn;
                    match?.breakUpMatch();
                    let matchmakingConfig = this._matchmakingConfigurations.getConfigByArn(configArn);
                    let destination:SceneDestination = {
                        container: matchmakingConfig,
                        type: "matchmakingConfig",
                        disappearAfter:false,
                        delay:0,
                    };
                    playerIds.map((playerId)=> // make players go back to the matchmaking config
                    {
                        Players.getPlayer(playerId).addDestination(destination);
                    });
                }
            }
            return;
        }

        queuePlacementEvent.placedPlayerSessions.map(playerSession => {
            playerIds.push(playerSession.playerId);
        });

        if (queuePlacementEvent.placementId)
        {
            let match = PlayerMatches.getMatch(queuePlacementEvent.placementId);

            switch (queuePlacementEvent.type)
            {
                case "PlacementFulfilled":
                    if (match==undefined)
                    {
                        console.log("UNDEFINED MATCH PLACEMENT FULFILLED!", queuePlacementEvent.placementId);
                        match = this.initializeMatch(queuePlacementEvent.placementId);
                    }

                    let queue = this._queues.getQueueByArn(resources[0]);
                    let queueDestination:SceneDestination = {
                        container: queue,
                        type: "queue",
                        delay:1000,
                        disappearAfter:false,
                    };
                    match.addDestination(queueDestination, (match.playerIds.length != playerIds.length));

                    let instance = this._fleets.getInstanceByIp(queuePlacementEvent.ipAddress);
                    let instanceDestination:SceneDestination = {
                        container: instance,
                        type: "instance",
                        disappearAfter: true,
                        delay:1000,
                    };
                    match.addDestination(instanceDestination, (match.playerIds.length != playerIds.length));

                    break;
            }
        }

        //let instance = this._fleets.getInstanceByIp(queuePlacementEvent.ipAddress);
        //player.matchedSuccessfully(instance);
    }

    processState(state:State)
    {
        this._currentState = state;
        /*
        let playerSessions=[];
        for (let playerSession of state.PlayerSessions)
        {
            playerSessions[playerSession.GameSessionId] = playerSessions[playerSession.GameSessionId] || [];
            playerSessions[playerSession.GameSessionId].push(playerSession);
        }

         */

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

            this._stateLoaded=true;
        }


        /*
        for (let fleetAttributes of state.FleetAttributes)
        {
            var currentFleet=fleetAttributes;
            currentFleet["GameSessions"]=[];
            currentFleet["Instances"]=[];

            for (let capacity of state.FleetCapacities)
            {
                if (capacity.FleetId == currentFleet.FleetId)
                {
                    currentFleet["FleetCapacity"] = capacity;
                }
            }

            for (let gameSession of state.GameSessions)
            {
                if (gameSession.FleetId == currentFleet.FleetId)
                {
                    //gameSession["PlayerSessions"] = playerSessions[gameSession.GameSessionId] || [];
                    currentFleet["GameSessions"].push(gameSession);
                }
            }

            for (let utilization of state.FleetUtilization)
            {
                if (utilization.FleetId == currentFleet.FleetId)
                {
                    currentFleet["FleetUtilization"] = utilization;
                }
            }

            for (let instance of state.Instances)
            {
                if (instance.FleetId == currentFleet.FleetId)
                {
                    currentFleet["Instances"].push(instance);
                }
            }

            this._fleets.updateFleet(currentFleet as Data.Fleet);

        }

         */
        //console.log(this._fleets);
    }

    create ()
    {
        this.scale.on('resize', this.doResize, this);
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
        //this.input.enableDebug(this._settingsButton);

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
        this._emitter.on(Events.SOCKET_MESSAGE, this.onSocketMessage);
        this._emitter.on(Events.PLAYER_ADDED_TO_GAME_SESSION, this.onPlayerAddedToGameSession);
    };

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
        //console.log("SHOW MATCHMAKING CONFIG QUEUES");

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
        //console.log("SHOW QUEUE FLEETS");

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

        /*
        const arrowAngle = Math.PI / 4;
        const arrowLine1X = endX + pointerLineLength * Math.cos(Math.PI - startEndRadians + arrowAngle);
        const arrowLine1Y = endY - pointerLineLength * Math.sin(Math.PI - startEndRadians + arrowAngle);
        const arrowLine2X = endX + pointerLineLength * Math.cos(Math.PI - startEndRadians - arrowAngle);
        const arrowLine2Y = endY - pointerLineLength * Math.sin(Math.PI - startEndRadians - arrowAngle);

        const line2 = this.add.line(
            0,
            0,
            endX,
            endY,
            arrowLine1X,
            arrowLine1Y,
            color
        ).setOrigin(0, 0);

        const line3 = this.add.line(
            0,
            0,
            endX,
            endY,
            arrowLine2X,
            arrowLine2Y,
            color
        ).setOrigin(0, 0);


        this._lines.push(line2);
        this._lines.push(line3);
*/
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

    onSocketMessage = (data:any)=>
    {
        //console.log(data);

        console.log("MESSAGE RECEIVED!", data);
        let stateMessage:StateMessage = null;
        if (this._stateLoaded==false && data["Type"]!="GetState")
        {
            return;
        }
        switch (data["Type"])
        {
            case "GetState":
                stateMessage = data as StateMessage;
                if (ConsoleScene.disableUpdates==false)
                {
                    this.processState(stateMessage.State);
                }
                break;

            case "QueuePlacementEvent":
                stateMessage = data as StateMessage;
                this.processQueuePlacementEvent(stateMessage.QueuePlacementEventDetail, stateMessage.Resources);
                break;

            case "FlexMatchEvent":
                stateMessage = data as StateMessage;
                this.processFlexMatchEvent(stateMessage.FlexMatchEventDetail, stateMessage.Resources);
                break;

            case "AdjustFleetCapacity":
                this._emitter.emit(Events.ADJUST_FLEET_SCALING_RESPONSE, data as SimpleResult);
                break;

            case "SetScalingPolicy":
                this._emitter.emit(Events.SET_SCALING_POLICY_RESPONSE, data as SimpleResult);
                break;

            case "DeleteScalingPolicy":
                this._emitter.emit(Events.DELETE_SCALING_POLICY_RESPONSE, data as SimpleResult);
                break;

            case "UpdateFleetLocations":
                this._emitter.emit(Events.UPDATE_FLEET_LOCATIONS_RESPONSE, data as SimpleResult);
                break;

            case "TerminateVirtualPlayer":
                this._emitter.emit(Events.TERMINATE_VIRTUAL_PLAYER_RESPONSE, data as SimpleResult);
                break;

            case "GetGameSessions":
                this._emitter.emit(Events.GET_GAME_SESSIONS_RESPONSE, data.GameSessions);
                break;

            case "GetFleetScaling":
                this._emitter.emit(Events.GET_FLEET_SCALING_RESPONSE, data as SimpleResult);
                break;

            case "GetGameSessionLogs":
                this._emitter.emit(Events.GET_GAME_SESSION_LOGS_RESPONSE, data);
                break;

            case "RunMatchmakingSimulation":
                this._emitter.emit(Events.RUN_MATCHMAKING_SIMULATION_RESPONSE, data.Simulation);
                break;

            case "MatchmakingSimulationUpdate":
                this._emitter.emit(Events.MATCHMAKING_SIMULATION_UPDATE, data.Simulation);
                break;

            case "GetSimulationMatches":
                this._emitter.emit(Events.GET_SIMULATION_SUCCESSFUL_MATCHES_RESPONSE, data.MatchResults);
                break;

            case "GetTaskDefinitions":
                this._emitter.emit(Events.GET_TASK_DEFINITIONS_RESPONSE, data as SimpleResult);
                break;

            case "GetPlayerSessions":
                this._emitter.emit(Events.GET_PLAYER_SESSIONS_RESPONSE, data.PlayerSessions);
                break;

            case "SavePlayerProfile":
                this._emitter.emit(Events.SAVE_PLAYER_PROFILE_RESPONSE, data);
                break;

            case "DeletePlayerProfile":
                this._emitter.emit(Events.DELETE_PLAYER_PROFILE_RESPONSE, data);
                break;

            case "GetQueueEvents":
                this._emitter.emit(Events.GET_QUEUE_EVENTS_RESPONSE, data.Events);
                break;

            case "GetQueueEventByPlacementId":
                this._emitter.emit(Events.GET_QUEUE_EVENT_BY_PLACEMENT_ID_RESPONSE, data.Event);
                break;

            case "GetMatchmakingRuleSets":
                this._emitter.emit(Events.GET_MATCHMAKING_RULESETS_RESPONSE, data.RuleSets);
                break;

            case "GetMatchmakingSimulations":
                this._emitter.emit(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, data.Simulations);
                break;

            case "GetMatchmakingSimulation":
                this._emitter.emit(Events.GET_MATCHMAKING_SIMULATION_RESPONSE, data.Simulation);
                break;

            case "GetPlayerProfiles":
                this._emitter.emit(Events.GET_PLAYER_PROFILES_RESPONSE, data.Profiles);
                break;

            case "GetVirtualPlayers":
                this._emitter.emit(Events.GET_VIRTUAL_PLAYERS_RESPONSE, data);
                break;

            case "GetMatchmakingTicketHeaders":
                this._emitter.emit(Events.GET_MATCHMAKING_TICKET_HEADERS_RESPONSE, data);
                break;

            case "GetMatchmakingTicketHeadersByMatchId":
                this._emitter.emit(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, data);
                break;

            case "GetMatchmakingTicketHeadersBySimulationId":
                this._emitter.emit(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, data);
                break;

            case "GetMatchmakingTicket":
                this._emitter.emit(Events.GET_MATCHMAKING_TICKET_RESPONSE, data);
                break;

            case "GetCloudWatchGraph":
                this._emitter.emit(Events.GET_CLOUDWATCH_GRAPH_RESPONSE, data);
                break;

            case "ValidateMatchmakingRuleSet":
                this._emitter.emit(Events.VALIDATE_MATCHMAKING_RULESET_RESPONSE, data);
                break;

            case "CreateMatchmakingRuleSet":
                this._emitter.emit(Events.CREATE_MATCHMAKING_RULESET_RESPONSE, data);
                break;

            case "DeleteMatchmakingRuleSet":
                this._emitter.emit(Events.DELETE_MATCHMAKING_RULESET_RESPONSE, data);
                break;

            case "UpdateMatchmakingConfiguration":
                this._emitter.emit(Events.UPDATE_MATCHMAKING_CONFIGURATION_RESPONSE, data);
                break;

            case "LaunchPlayers":
                this._emitter.emit(Events.LAUNCH_VIRTUAL_PLAYERS_RESPONSE, data);
                break;

        }
    }



    onSettingsOpen = () =>
    {
        this._settingsPanel.show();
        //this._settingsButton.input.enabled=false;
        this._settingsButton.disable();
    };

    onSettingsClose = () =>
    {
        this._settingsPanel.hide();
        //this._settingsButton.input.enabled=true;
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
                        console.log(PlayerMatches.getMatch(matchId).playerIds);

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
                        match.addDestination(queueDestination, (match.playerIds.length != 2));

                        let instanceDestination:SceneDestination = {
                            container: instance,
                            type: "instance",
                            disappearAfter: true,
                            delay:1000,
                        };
                        match.addDestination(instanceDestination, (match.playerIds.length != 2));
                    }
                }
                Players.getPlayer(playerId).addDestination(matchDestination);
            });

            await new Promise(r => setTimeout(r, Math.ceil(Math.random()*500)+200));
        }
    };

    onLaunchPlayers = (event) =>
    {
        Network.sendObject({"Type":"LaunchPlayers", "NumPlayers":parseInt(event.numPlayers), "TaskDefinitionArn":event.taskDefinitionArn});
    };

    onAddFakeFleet = (numInstances=10) =>
    {
        numInstances = Math.ceil(Math.random()*20);
        if (numInstances<5)
        {
            numInstances=3;
        }
        ConsoleScene.disableUpdates=true;
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
        //this._fleets.addFleet(Phaser.Utils.String.UUID(), true);
    };

    onAddFakeGameSession = () =>
    {
        let fleetId = Object.keys(this._fleets.Fleets)[0];
        this._fleets.Fleets[fleetId].addGameSession(Phaser.Utils.String.UUID(), true);
        //this._fleets.addFleet(Phaser.Utils.String.UUID(), true);
    };

    onSceneClick = (pointer, localX, localY, event)  =>
    {
        this._emitter.emit(Events.CLOSE_POPUP);
        this._emitter.emit(Events.CLOSE_MENUS);
        //this._popup?.hide();
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