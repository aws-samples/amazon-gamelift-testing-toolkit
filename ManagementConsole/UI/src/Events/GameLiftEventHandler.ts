import {EventDispatcher} from "./EventDispatcher";
import {PlayerState, SceneDestination} from "../Elements/Player";
import {PlayerMatches} from "../Elements/PlayerMatches";
import {Players} from "../Elements/Players";
import {DataTypes} from "../Data/DataTypes";
import {ConsoleScene} from "../Scenes/ConsoleScene";
import {Events} from "./Events";
import StateMessage = DataTypes.StateMessage;
import {ScreenResolution} from "../Data/ScreenResolution";
import {PlayerMatch} from "../Elements/PlayerMatch";

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

        if (flexMatchEvent.matchId && flexMatchEvent.type == "PotentialMatchCreated") // we have a match
        {
            // construct match
            let match = consoleScene.initializeMatch(flexMatchEvent.matchId, resources[0]);

            eventPlayerIds.map((playerId)=> // make players move to match destination and then get added to the match
            {
                if (Players.getPlayer(playerId).playerState!=PlayerState.IN_MATCH)
                {
                    let matchDestination:SceneDestination = {
                        type: "match",
                        container:match,
                        callback: () =>
                        {
                            match.addPlayerToMatch(playerId);

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
                    Players.getPlayer(playerId).playerState = PlayerState.WALKING_TO_MATCH;
                    Players.getPlayer(playerId).addDestination(matchDestination);
                }
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
                if (Players.getPlayer(playerId).playerState!=PlayerState.WALKING_TO_MATCH && Players.getPlayer(playerId).playerState!=PlayerState.IN_MATCH) // in case events arrive out of order
                {
                    // break up any match involving these players, if one exists
                    let match = PlayerMatches.findPlayerMatch(playerId);
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
                    Players.getPlayer(playerId).playerState = PlayerState.WAITING_FOR_MATCH;
                    Players.getPlayer(playerId).addDestination(destination);
                }
            });

            return;
        }

        if (flexMatchEvent.type == "MatchmakingTimedOut" || flexMatchEvent.type == "MatchmakingCancelled")
        {
            eventPlayerIds.map((playerId)=>
            {
                if (Players.getPlayer(playerId).activeTicketId == playerTicketMap[playerId]) // if we have a different type of event, make players go back to the start
                {
                    Players.getPlayer(playerId).resetPlayer();
                }
            });

            return;
        }
    }

    onQueuePlacementEvent(stateMessage:StateMessage)
    {
        console.log(stateMessage);
        let queuePlacementEvent = stateMessage.QueuePlacementEventDetail;
        let resources = stateMessage.Resources;
        let consoleScene = ConsoleScene.getInstance();

        let playerIds:string[] = [];

        if (queuePlacementEvent.placedPlayerSessions==null) // the queue placement has failed for some reason
        {
            if (queuePlacementEvent.placementId)
            {
                let match = PlayerMatches.getMatch(queuePlacementEvent.placementId); // look up the corresponding match and break it up
                if (match)
                {
                    playerIds = match.playerIds;
                    let configArn = match.creatorArn;
                    match?.breakUpMatch();
                    let matchmakingConfig = consoleScene.getMatchmakingConfigurations().getConfigByArn(configArn);
                    let destination:SceneDestination = {
                        container: matchmakingConfig,
                        type: "matchmakingConfig",
                        disappearAfter:false,
                        delay:0,
                    };
                    playerIds.map((playerId)=> // make players go back to the matchmaking config
                    {
                        Players.getPlayer(playerId).moveToInitialPosition();
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
            let match = PlayerMatches.getMatch(queuePlacementEvent.placementId);

            switch (queuePlacementEvent.type)
            {
                case "PlacementFulfilled":
                    if (match==undefined) // flexmatch events haven't been processed yet, or queues being used without flexmatch
                    {
                        match = consoleScene.initializeMatch(queuePlacementEvent.placementId, resources[0]);
                        playerIds.map(playerId => match.addPlayerToMatch(playerId));
                    }

                    if (match.getNextDestination()!=null) // match is already animating
                    {
                        return;
                    }

                    console.log(match);
                    match.placementEvent = queuePlacementEvent;

                    if (match.creatorType==PlayerMatch.MATCHMAKING_CREATOR)
                    {
                        let queue = consoleScene.getQueues().getQueueByArn(resources[0]);
                        let queueDestination:SceneDestination = {
                            container: queue,
                            type: "queue",
                            delay:1000,
                            disappearAfter:false,
                        };
                        match.addDestination(queueDestination);
                    }

                    let instance = consoleScene.getFleets().getInstanceByIp(queuePlacementEvent.ipAddress);
                    if (instance)
                    {
                        let instanceDestination:SceneDestination = {
                            container: instance,
                            type: "instance",
                            disappearAfter: true,
                            delay:1000,
                        };
                        match.addDestination(instanceDestination);
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
                        match.addDestination(fallbackDestination);

                    }

                    break;
            }
        }
    }
}