// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {PageManager} from "../Pages/PageManager";
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";

export class SimulateMatchmakingSimulationsPage extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_SIMULATIONS;
    public static cacheKey = this.id;

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingSimulationsPage.cacheKey,  parentPage, SimulateMatchmakingSimulationsPage.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.attr("id")=="simulateMatchmakingButton") // show simulation form
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_FORM);
        }
        else
        if (el.hasClass("viewSimulationOutput"))
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_OUTPUT, {SimulationId: el.attr("id")});
        }
    }

    onGetMatchmakingSimulationsResponse = (data) =>
    {
        let html="";
        data.map(simulation =>
        {
            let viewResultsTd='<td><a class="viewSimulationOutput btn btn-primary btn-sm" id="' + simulation.SimulationId +'" href="' + "#" + '">View</a></td>';

            let totalPlayers = 0;
            simulation.PlayersConfig.map(config =>
            {
                totalPlayers+= config.NumPlayers
            });
            let totalMatchAttempts = simulation.MatchesMade+simulation.MatchesFailed;
            let totalEvents = simulation.MatchmakingCancelledEvents + simulation.MatchmakingFailedEvents + simulation.MatchmakingSearchingEvents + simulation.PotentialMatchCreatedEvents + simulation.MatchmakingSucceededEvents;

            html += '<tr>' +
                '<td>' + simulation.Date + '</td>'+
                '<td>' + simulation.RuleSet.substring(simulation.RuleSet.lastIndexOf('/') + 1) + '</td>'+
                '<td>' + simulation.PlayersMatched + '/' + totalPlayers + '</td>'+
                '<td>' + simulation.MatchesMade + '/' + totalMatchAttempts + '</td>'+
                '<td>' + totalEvents + '</td>'+
                viewResultsTd +
                '</tr>';
        });

        this.resetTable();
        this.selector.find("table#matchmakingSimulationsTable tbody").append( html);
        this.activateDataTable("matchmakingSimulationsTable");
    }

    initPage() {
        Network.sendObject({Type:"GetMatchmakingSimulations"});
    }

    resetTable()
    {
        this.resetElement(".simulateMatchmakingTableContainer");
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, this.onGetMatchmakingSimulationsResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, this.onGetMatchmakingSimulationsResponse);
    }

}