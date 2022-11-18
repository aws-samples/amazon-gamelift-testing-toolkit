// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {PopupClickEvent} from "../../Events/PopupClickEvent";
import {FleetScalingPopup} from "./FleetScalingPopup";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Popup} from "../Abstract/Popup";
import {Events} from "../../Events/Events";
import {Scene} from "phaser";
import {Player} from "../Player";
import {FleetLocationsPopup} from "./FleetLocationsPopup";
import {FleetEventsPopup} from "./FleetEventsPopup";
import {GameSessionsTablePopup} from "./GameSessionsTablePopup";
import {QueueEventsPopup} from "./QueueEventsPopup";
import {MatchmakingTicketsPopup} from "./MatchmakingTicketsPopup";
import {ManageVirtualPlayersPopup} from "./ManageVirtualPlayersPopup";
import {LaunchVirtualPlayersPopup} from "./LaunchVirtualPlayersPopup";
import {SimpleJsonPopup} from "./SimpleJsonPopup";
import {MatchmakingRuleSetsPopup} from "./MatchmakingRuleSetsPopup";
import {MatchmakingConfigPopup} from "./MatchmakingConfigPopup";
import {MatchmakingGraphPopup} from "./MatchmakingGraphPopup";
import {QueueGraphPopup} from "./QueueGraphPopup";
import {FleetGraphPopup} from "./FleetGraphPopup";
import {FlexMatchSimulatorPopup} from "./FlexMatchSimulatorPopup";
import {QueueSettingsPopup} from "./QueueSettingsPopup";

export class PopupHandler
{
    protected static emitter: EventDispatcher;
    protected static popup: Popup;
    protected static scene: Scene;

    public static registerScene(scene:Scene)
    {
        PopupHandler.emitter = EventDispatcher.getInstance();
        PopupHandler.scene = scene;
        PopupHandler.setupEventListeners();
    }

    public static setupEventListeners()
    {
        PopupHandler.emitter.on(Events.CLOSE_POPUP, PopupHandler.onClosePopup);
        PopupHandler.emitter.on(Events.SHOW_FLEET_POPUP, PopupHandler.onShowFleetPopup);
        PopupHandler.emitter.on(Events.SHOW_PLAYER_POPUP, PopupHandler.onShowPlayerPopup);
        PopupHandler.emitter.on(Events.SHOW_INSTANCE_POPUP, PopupHandler.onShowInstancePopup);
        PopupHandler.emitter.on(Events.SHOW_FLEET_SCALING_POPUP, PopupHandler.onShowFleetScalingPopup);
        PopupHandler.emitter.on(Events.SHOW_FLEET_LOCATIONS_POPUP, PopupHandler.onShowFleetLocationsPopup);
        PopupHandler.emitter.on(Events.SHOW_FLEET_EVENTS_POPUP, PopupHandler.onShowFleetEventsPopup);
        PopupHandler.emitter.on(Events.SHOW_GAME_SESSIONS_TABLE_POPUP, PopupHandler.onShowGameSessionsTablePopup);
        PopupHandler.emitter.on(Events.SHOW_MANAGE_VIRTUAL_PLAYERS_POPUP, PopupHandler.onShowManageVirtualPlayersPopup);
        PopupHandler.emitter.on(Events.SHOW_FLEXMATCH_SIMULATOR_POPUP, PopupHandler.onShowFlexMatchSimulatorPopup);
        PopupHandler.emitter.on(Events.SHOW_LAUNCH_VIRTUAL_PLAYERS_POPUP, PopupHandler.onShowLaunchVirtualPlayersPopup);
        PopupHandler.emitter.on(Events.SHOW_QUEUE_POPUP, PopupHandler.onShowQueuePopup);
        PopupHandler.emitter.on(Events.SHOW_QUEUE_EVENTS_POPUP, PopupHandler.onShowQueueEventsPopup);
        PopupHandler.emitter.on(Events.SHOW_QUEUE_SETTINGS_POPUP, PopupHandler.onShowQueueSettingsPopup);
        PopupHandler.emitter.on(Events.SHOW_MATCHMAKING_RULESETS_POPUP, PopupHandler.onShowMatchmakingRuleSetsPopup);
        PopupHandler.emitter.on(Events.CLOSE_POPUP, PopupHandler.onClosePopup);
        PopupHandler.emitter.on(Events.SHOW_MATCHMAKING_CONFIG_POPUP, PopupHandler.onShowMatchmakingPopup);
        PopupHandler.emitter.on(Events.SHOW_MATCHMAKING_TICKETS_POPUP, PopupHandler.onShowMatchmakingTicketsPopup);
        PopupHandler.emitter.on(Events.SHOW_MODIFY_MATCHMAKING_CONFIGURATION_POPUP, PopupHandler.onShowModifyMatchmakingConfigurationPopup);
        PopupHandler.emitter.on(Events.SHOW_MATCHMAKING_GRAPH_POPUP, PopupHandler.onShowMatchmakingGraphPopup);
        PopupHandler.emitter.on(Events.SHOW_QUEUE_GRAPH_POPUP, PopupHandler.onShowQueueGraphPopup);
        PopupHandler.emitter.on(Events.SHOW_FLEET_GRAPH_POPUP, PopupHandler.onShowFleetGraphPopup);
    }

    static onShowPlayerPopup = (event:PopupClickEvent) =>
    {
        PopupHandler.onClosePopup();
        let player:Player = event.gameObject as Player;
        player.moveToInitialPosition();

    }

    protected static onShowMatchmakingPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            //PopupHandler.popup = new MatchmakingPopup(PopupHandler.scene, 0, 0);
            PopupHandler.popup = new SimpleJsonPopup(PopupHandler.scene, 0, 0, "MatchmakingConfig: " + event.gameObject._matchmakingConfig.Name);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject._matchmakingConfig);
        }
    };

    protected static onShowModifyMatchmakingConfigurationPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            //PopupHandler.popup = new MatchmakingPopup(PopupHandler.scene, 0, 0);
            PopupHandler.popup = new MatchmakingConfigPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject._matchmakingConfig);
        }
    };

    protected static onShowMatchmakingGraphPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new MatchmakingGraphPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject._matchmakingConfig);
        }
    };

    protected static onShowQueueGraphPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new QueueGraphPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject._gameSessionQueue);
        }
    };

    protected static onShowFleetGraphPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new FleetGraphPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject.Data);
        }
    };

    protected static onShowMatchmakingTicketsPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new MatchmakingTicketsPopup(PopupHandler.scene, 0, 0, event.gameObject._matchmakingConfig.ConfigurationArn);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event);
        }
    };

    protected static onShowMatchmakingRuleSetsPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new MatchmakingRuleSetsPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event);
        }
    };

    protected static onShowFleetEventsPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new FleetEventsPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event);
        }
    };

    protected static onShowQueueEventsPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new QueueEventsPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event);
        }
    };

    protected static onShowGameSessionsTablePopup = (event:PopupClickEvent) =>
    {
        PopupHandler.onClosePopup();
        PopupHandler.popup = new GameSessionsTablePopup(PopupHandler.scene, 0, 0);
        PopupHandler.scene.add.existing(PopupHandler.popup);
        PopupHandler.popup.show(event);
    };

    protected static onShowQueueSettingsPopup = (event:PopupClickEvent) =>
    {
        PopupHandler.onClosePopup();
        PopupHandler.popup = new QueueSettingsPopup(PopupHandler.scene, 0, 0);
        PopupHandler.scene.add.existing(PopupHandler.popup);
        PopupHandler.popup.show(event);
    };

    protected static onShowFlexMatchSimulatorPopup = (event:PopupClickEvent) =>
    {
        PopupHandler.onClosePopup();
        PopupHandler.popup = new FlexMatchSimulatorPopup(PopupHandler.scene, 0, 0);
        PopupHandler.scene.add.existing(PopupHandler.popup);
        PopupHandler.popup.show(event);
    };

    protected static onShowManageVirtualPlayersPopup = (event:PopupClickEvent) =>
    {
        PopupHandler.onClosePopup();
        PopupHandler.popup = new ManageVirtualPlayersPopup(PopupHandler.scene, 0, 0);
        PopupHandler.scene.add.existing(PopupHandler.popup);
        PopupHandler.popup.show(event);
    };

    protected static onShowLaunchVirtualPlayersPopup = (event:PopupClickEvent) =>
    {
        PopupHandler.onClosePopup();
        let popup = new LaunchVirtualPlayersPopup(PopupHandler.scene, 0, 0);
        PopupHandler.popup = popup
        PopupHandler.scene.add.existing(PopupHandler.popup);
        PopupHandler.popup.show(event);
    };

    static onShowQueuePopup = (event:PopupClickEvent) =>
    {
        //PopupHandler.onClosePopup();
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            //PopupHandler.popup = new QueuePopup(PopupHandler.scene, 0, 0);
            PopupHandler.popup = new SimpleJsonPopup(PopupHandler.scene, 0, 0, "Queue: " + event.gameObject.Data.Name);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject.Data);
        }
    };

    static onShowInstancePopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
//            PopupHandler.popup = new InstancePopup(PopupHandler.scene, 0, 0);
            PopupHandler.popup = new SimpleJsonPopup(PopupHandler.scene, 0, 0, "Instance: " + event.gameObject.Data.DnsName);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject.Data);
        }
    };

    static onShowFleetScalingPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new FleetScalingPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event);
        }
    };

    static onShowFleetLocationsPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new FleetLocationsPopup(PopupHandler.scene, 0, 0);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event);
        }
    };

    static onShowFleetPopup = (event:PopupClickEvent) =>
    {
        if (PopupHandler.popup!=null)
        {
            PopupHandler.onClosePopup();
        }
        else
        {
            PopupHandler.popup = new SimpleJsonPopup(PopupHandler.scene, 0, 0, "Fleet: " + event.gameObject.Data.FleetAttributes.Name);
            PopupHandler.scene.add.existing(PopupHandler.popup);
            PopupHandler.popup.show(event.gameObject.Data);
        }
    };

    static onClosePopup = () =>
    {
        PopupHandler.popup?.hide();
        PopupHandler.popup?.destroy();
        PopupHandler.popup = null;
    };
}