import {EventDispatcher} from "./EventDispatcher";
import {PlayerState, SceneDestination} from "../Elements/Player";
import {MatchManager} from "../Managers/MatchManager";
import {PlayerManager} from "../Managers/PlayerManager";
import {DataTypes} from "../Data/DataTypes";
import {ConsoleScene} from "../Scenes/ConsoleScene";
import {Events} from "./Events";
import StateMessage = DataTypes.StateMessage;
import {ScreenResolution} from "../Data/ScreenResolution";
import {PlayerMatchState} from "../Elements/PlayerMatch";
import {FlexMatchEventType} from "../Data/FlexMatchEventType";
import {QueuePlacementEventType} from "../Data/QueuePlacementEventType";

export class GameLiftEventHandler
{
    protected _emitter: EventDispatcher = EventDispatcher.getInstance();

    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.FLEXMATCH_EVENT, this.onFlexMatchEvent);
        this._emitter.on(Events.REPLAY_FLEXMATCH_EVENT, this.onReplayFlexMatchEvent);
        this._emitter.on(Events.QUEUE_PLACEMENT_EVENT, this.onQueuePlacementEvent);
        this._emitter.on(Events.REPLAY_QUEUE_PLACEMENT_EVENT, this.onReplayQueuePlacementEvent);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.FLEXMATCH_EVENT, this.onFlexMatchEvent);
        this._emitter.off(Events.REPLAY_FLEXMATCH_EVENT, this.onReplayFlexMatchEvent);
        this._emitter.off(Events.QUEUE_PLACEMENT_EVENT, this.onQueuePlacementEvent);
        this._emitter.off(Events.REPLAY_QUEUE_PLACEMENT_EVENT, this.onReplayQueuePlacementEvent);
    }

    onReplayFlexMatchEvent = (data)=>
    {
        this.onFlexMatchEvent({
            FlexMatchEventDetail: data.detail,
            Resources: data.resources,
            Type: "FlexMatchEvent",
            QueuePlacementEventDetail:null,
            State:null,
        });
    };

    onReplayQueuePlacementEvent = (data) =>
    {
        this.onQueuePlacementEvent({
            FlexMatchEventDetail: null,
            Resources: data.resources,
            Type: "QueuePlacementEvent",
            QueuePlacementEventDetail:data.detail,
            State:null,
        });
    };

    onFlexMatchEvent(stateMessage:StateMessage)
    {
        let flexMatchEvent = stateMessage.FlexMatchEventDetail;
        let resources = stateMessage.Resources;

        if (flexMatchEvent.matchId && flexMatchEvent.type == FlexMatchEventType.MATCHMAKING_SUCCEEDED)
        {
            return;
        }

        let eventPlayerIds:string[] = [];

        let consoleScene = ConsoleScene.getInstance();

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
                    eventPlayerIds.push(player.playerId);
                    consoleScene.addPlayer(player.playerId);
                });
            }
        });

        let matchmakingConfig = consoleScene.getMatchmakingConfigurations().getConfigByArn(resources[0]);
        if (matchmakingConfig==null)
        {
            return;
        }

        if (flexMatchEvent.matchId && flexMatchEvent.type == FlexMatchEventType.POTENTIAL_MATCH_CREATED) // we have a match
        {
            eventPlayerIds.map((playerId)=>
            {
                // break up any match involving these players, if one exists
                let match = MatchManager.findPlayerMatch(playerId);
                if (match)
                {
                    if (match.matchState!=PlayerMatchState.MOVING_TO_INSTANCE)
                    {
                        match?.breakUpMatch();
                    }
                }

            });

            // construct match
            let match = MatchManager.initializeMatch(flexMatchEvent.matchId, resources[0], eventPlayerIds.length);

            eventPlayerIds.map((playerId)=> // make players move to match destination and then get added to the match
            {
                if (PlayerManager.getPlayer(playerId).playerState!=PlayerState.IN_MATCH)
                {
                    let matchDestination:SceneDestination = {
                        type: "match",
                        container:match,
                        callback: () =>
                        {
                            if (match.addPlayerToMatch(playerId))
                            {
                                if (MatchManager.getMatch(flexMatchEvent.matchId).playerIds.length == eventPlayerIds.length) // once all the players are added to match, move to queue
                                {
                                    PlayerManager.getPlayer(playerId).storeEvent("MATCH IS FULL");
                                    let matchConfig = consoleScene.getMatchmakingConfigurations().getConfigByArn(resources[0]);
                                    if (matchConfig && matchConfig.Data && matchConfig.Data.GameSessionQueueArns.length)
                                    {
                                        let queue = consoleScene.getQueues().getQueueByArn(matchConfig.Data.GameSessionQueueArns[0]);
                                        if (queue)
                                        {
                                            let queueDestination:SceneDestination = {
                                                container: queue,
                                                type: "queue",
                                                delay: 1000,
                                                disappearAfter:false,
                                                callback: ()=>
                                                {
                                                    match.matchState = PlayerMatchState.READY_FOR_PLACEMENT;
                                                    if (match.instanceDestination)
                                                    {
                                                        match.moveToDestination(match.instanceDestination);
                                                    }
                                                },
                                            };
                                            match.queueDestination = queueDestination;
                                        }
                                    }
                                }
                                else
                                {
                                    PlayerManager.getPlayer(playerId).storeEvent("MATCH NOT FULL YET - EXPECTING " + MatchManager.getMatch(flexMatchEvent.matchId).playerIds.length + " BUT GOT " + eventPlayerIds.length);
                                }
                            }
                            else
                            {
                                PlayerManager.getPlayer(playerId).resetPlayer();
                            }
                        }
                    }
                    PlayerManager.getPlayer(playerId).destroyTimeline();
                    PlayerManager.getPlayer(playerId).storeEvent(flexMatchEvent);
                    PlayerManager.getPlayer(playerId).storeEvent(matchDestination);
                    PlayerManager.getPlayer(playerId).playerState = PlayerState.WALKING_TO_MATCH;
                    PlayerManager.getPlayer(playerId).addDestination(matchDestination);
                }
            });

            return;
        }
        else
        if (flexMatchEvent.type==FlexMatchEventType.MATCHMAKING_SEARCHING) // MatchmakingSearching is the start of a matchmaking cycle, so set player's active ticketId so we can ignore old ticket events
        {
            flexMatchEvent.tickets.map((ticket)=>
            {
                if (!ticket.ticketId.startsWith("auto-backfill"))
                {
                    ticket.players.map((player)=>
                    {
                        PlayerManager.getPlayer(player.playerId).activeTicketId = ticket.ticketId;
                    });
                }
            });

            eventPlayerIds.map((playerId)=>
            {
                if (PlayerManager.getPlayer(playerId).playerState!=PlayerState.WALKING_TO_MATCH && PlayerManager.getPlayer(playerId).playerState!=PlayerState.IN_MATCH) // in case events arrive out of order
                {
                    // break up any match involving these players, if one exists
                    let match = MatchManager.findPlayerMatch(playerId);
                    if (match)
                    {
                        match?.breakUpMatch();
                    }

                    // send player to matchmaking config
                    let destination:SceneDestination = {
                        container: matchmakingConfig,
                        type: "matchmakingConfig",
                        disappearAfter:false,
                        delay:0,
                    };
                    PlayerManager.getPlayer(playerId).storeEvent(flexMatchEvent);
                    PlayerManager.getPlayer(playerId).storeEvent(destination);
                    PlayerManager.getPlayer(playerId).playerState = PlayerState.WAITING_FOR_MATCH;
                    PlayerManager.getPlayer(playerId).addDestination(destination);
                }
            });

            return;
        }

        if (FlexMatchEventType.isFailureEvent(flexMatchEvent.type))
        {
            eventPlayerIds.map((playerId)=>
            {
                if (PlayerManager.getPlayer(playerId).activeTicketId == playerTicketMap[playerId]) // if we have a different type of event, make players go back to the start
                {
                    PlayerManager.getPlayer(playerId).resetPlayer();
                }
            });

            return;
        }
    }

    onQueuePlacementEvent(stateMessage:StateMessage)
    {
        let queuePlacementEvent = stateMessage.QueuePlacementEventDetail;
        let resources = stateMessage.Resources;
        let consoleScene = ConsoleScene.getInstance();

        let playerIds:string[] = [];

        if (QueuePlacementEventType.isFailureEvent(queuePlacementEvent.type)) // the queue placement has failed for some reason
        {
            if (queuePlacementEvent.placementId)
            {
                let match = MatchManager.getMatch(queuePlacementEvent.placementId); // look up the corresponding match and break it up
                if (match)
                {
                    playerIds = match.playerIds;
                    match?.breakUpMatch();

                    playerIds.map((playerId)=> // make players go back to the matchmaking config
                    {
                        PlayerManager.getPlayer(playerId).resetPlayer();
                    });
                }
            }
            return;
        }

        queuePlacementEvent.placedPlayerSessions.map(playerSession => {
            consoleScene.addPlayer(playerSession.playerId);
            playerIds.push(playerSession.playerId);
        });

        if (queuePlacementEvent.placementId)
        {
            let match = MatchManager.getMatch(queuePlacementEvent.placementId);

            switch (queuePlacementEvent.type)
            {
                case QueuePlacementEventType.PLACEMENT_FULFILLED:
                    if (match==undefined) // flexmatch events haven't been processed yet, or queues being used without flexmatch
                    {
                        match = MatchManager.initializeMatch(queuePlacementEvent.placementId, resources[0], playerIds.length);
                        match.matchState = PlayerMatchState.READY_FOR_PLACEMENT;
                        playerIds.map(playerId => match.addPlayerToMatch(playerId));
                    }

                    match.placementEvent = queuePlacementEvent;

                    let instance = consoleScene.getFleets().getInstanceByIp(queuePlacementEvent.ipAddress);
                    if (instance)
                    {
                        let instanceDestination:SceneDestination = {
                            container: instance,
                            type: "instance",
                            disappearAfter: true,
                            delay:1000,
                        };
                        match.instanceDestination = instanceDestination;
                    }
                    else
                    {
                        let fallbackDestination:SceneDestination = {
                            x:300,
                            y:ScreenResolution.height-50,
                            type: "fallback",
                            disappearAfter: true,
                            delay:1000,
                        };
                        match.instanceDestination = fallbackDestination;
                    }

                    break;
            }
        }
    }
}