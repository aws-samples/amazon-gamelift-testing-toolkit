import {Events} from "../Events/Events";
import {DataTypes} from "../Data/DataTypes";
import StateMessage = DataTypes.StateMessage;
import {ConsoleScene} from "../Scenes/ConsoleScene";
import {EventDispatcher} from "../Events/EventDispatcher";
import SimpleResult = DataTypes.SimpleResult;

export class MessageHandler
{
    protected _emitter: EventDispatcher = EventDispatcher.getInstance();

    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.SOCKET_MESSAGE, this.onSocketMessage);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.SOCKET_MESSAGE, this.onSocketMessage);
    }

    onSocketMessage  = (data:any)=>
    {
        console.log("MESSAGE RECEIVED!", data);
        if (ConsoleScene.getInstance().stateLoaded==false && data["Type"]!="GetState")
        {
            return;
        }
        switch (data["Type"])
        {
            case "GetState":
                this._emitter.emit(Events.STATE_UPDATE, data as StateMessage);
                break;

            case "QueuePlacementEvent":
                this._emitter.emit(Events.QUEUE_PLACEMENT_EVENT, data as StateMessage);
                break;

            case "GetCloudWatchLogs":
                this._emitter.emit(Events.GET_CLOUDWATCH_LOGS_RESPONSE, data);
                break;

            case "FlexMatchEvent":
                this._emitter.emit(Events.FLEXMATCH_EVENT, data as StateMessage);
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

            case "TerminateVirtualPlayerTasks":
                this._emitter.emit(Events.TERMINATE_VIRTUAL_PLAYER_TASKS_RESPONSE, data as SimpleResult);
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

            case "UpdateGameSessionQueue":
                this._emitter.emit(Events.UPDATE_GAME_SESSION_QUEUE_RESPONSE, data);
                break;

            case "GetGameSessionQueue":
                this._emitter.emit(Events.GET_GAME_SESSION_QUEUE, data);
                break;

            case "GetFleetAttributes":
                this._emitter.emit(Events.GET_FLEET_ATTRIBUTES, data);
                break;

            case "GetAliases":
                this._emitter.emit(Events.GET_ALIASES, data);
                break;

            case "GetGameSessionQueueDestinationInfo":
                this._emitter.emit(Events.GET_GAME_SESSION_QUEUE_DESTINATION_INFO, data);
                break;

            case "RunMatchmakingSimulation":
                this._emitter.emit(Events.RUN_MATCHMAKING_SIMULATION_RESPONSE, data.Simulation);
                break;

            case "MatchmakingSimulationUpdate":
                this._emitter.emit(Events.MATCHMAKING_SIMULATION_UPDATE, data.Simulation);
                break;

            case "GetSimulationMatches":
                this._emitter.emit(Events.GET_SIMULATION_MATCHES_RESPONSE, data.MatchResults);
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

            case "SaveLatencyProfile":
                this._emitter.emit(Events.SAVE_LATENCY_PROFILE_RESPONSE, data);
                break;

            case "DeleteLatencyProfile":
                this._emitter.emit(Events.DELETE_LATENCY_PROFILE_RESPONSE, data);
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

            case "GetLatencyProfiles":
                this._emitter.emit(Events.GET_LATENCY_PROFILES_RESPONSE, data.Profiles);
                break;

            case "GetVirtualPlayerTasks":
                this._emitter.emit(Events.GET_VIRTUAL_PLAYER_TASKS_RESPONSE, data);
                break;

            case "GetVirtualPlayerLaunchTaskRequests":
                this._emitter.emit(Events.GET_VIRTUAL_PLAYER_LAUNCH_TASK_REQUESTS_RESPONSE, data);
                break;

            case "GetVirtualPlayerTaskSchedules":
                this._emitter.emit(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, data);
                break;

            case "CreateVirtualPlayerTaskSchedule":
                this._emitter.emit(Events.CREATE_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, data);
                break;

            case "DeleteVirtualPlayerTaskSchedule":
                this._emitter.emit(Events.DELETE_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, data);
                break;

            case "GetVirtualPlayerTaskQuotas":
                this._emitter.emit(Events.GET_VIRTUAL_PLAYER_TASK_QUOTAS_RESPONSE, data);
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

            case "LaunchPlayersProgress":
                this._emitter.emit(Events.LAUNCH_VIRTUAL_PLAYERS_PROGRESS_RESPONSE, data);
                break;

        }
    };
}