// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {PageManager} from "../Pages/PageManager";
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";

export class SimulateMatchmakingOutput extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_OUTPUT;
    public static url = "assets/html/fragments/simulateMatchmakingOutput.html";
    protected _currentSimulation;
    protected _intervalId;

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingOutput.url,  parentPage, SimulateMatchmakingOutput.id);
        this.getSimulationData = this.getSimulationData.bind(this);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.attr("id")=="backToMatchmakingSimulations") // back to simulations table
        {
            this.goBack();
        }
        else
        if (el.attr("id")=="showSimulationTickets")
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_TICKETS, this._currentSimulation);
        }
        if (el.attr("id")=="showSimulationResults")
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_RESULTS, this._currentSimulation);
        }
    }

    startPolling()
    {
        this._intervalId = setInterval(this.getSimulationData, 1000);
    }

    stopPolling()
    {
        if (this._intervalId!=null)
        {
            clearInterval(this._intervalId);
            this._intervalId=null;
        }
    }

    public setPageData(data:any)
    {
        this._currentSimulation = data;
    }

    getSimulationData()
    {
        Network.sendObject({Type:"GetMatchmakingSimulation", SimulationId:this._currentSimulation.SimulationId});
    }

    initPage() {
        this.resetPage();
        this.startPolling();
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_MATCHMAKING_SIMULATION_RESPONSE, this.onGetMatchmakingSimulationResponse);
    }
    
    removeEventListeners() {
        this._emitter.off(Events.GET_MATCHMAKING_SIMULATION_RESPONSE, this.onGetMatchmakingSimulationResponse);
        this.stopPolling();
    }

    onGetMatchmakingSimulationResponse = (simulation) =>
    {
        this.updateSimulationStats(simulation);
    }

    updateSimulationStats(simulation)
    {
        let totalPlayers = 0;
        simulation.PlayersConfig.map(config =>
        {
            totalPlayers+= config.NumPlayers
        });
        let totalMatchAttempts = simulation.MatchesMade+simulation.MatchesFailed;
        let totalEvents = simulation.MatchmakingCancelledEvents + simulation.MatchmakingFailedEvents + simulation.MatchmakingSearchingEvents + simulation.PotentialMatchCreatedEvents + simulation.MatchmakingSucceededEvents;

        if (simulation.PlayersMatched + simulation.PlayersFailed == totalPlayers)
        {
            this.stopPolling();
            $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation Complete");
            $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("inProgressBg").addClass("completeBg");
            $('#'+this._domId).find("#showSimulationResults").show();
            $('#'+this._domId).find("#showSimulationTickets").show();
        }
        else
        {
            $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation In Progress");
            $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("completeBg").addClass("inProgressBg");
        }

        $('#'+this._domId).find(".simulateMatchmakingOutput span.simulationDate").html(simulation.Date);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.totalPlayers").html(totalPlayers.toString());
        $('#'+this._domId).find(".simulateMatchmakingOutput span.totalEvents").html(totalEvents.toString());
        $('#'+this._domId).find(".simulateMatchmakingOutput span.totalMatchAttempts").html(totalMatchAttempts.toString());
        $('#'+this._domId).find(".simulateMatchmakingOutput span.playersMatched").html(simulation.PlayersMatched + '/' + totalPlayers);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.playersMatchFailed").html(simulation.PlayersFailed + '/' + totalPlayers);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.matchesMade").html(simulation.MatchesMade + '/' + totalMatchAttempts);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingSearchingEvents").html(simulation.MatchmakingSearchingEvents);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.potentialMatchCreatedEvents").html(simulation.PotentialMatchCreatedEvents);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingSucceededEvents").html(simulation.MatchmakingSucceededEvents);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingTimedOutEvents").html(simulation.MatchmakingTimedOutEvents);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingCancelledEvents").html(simulation.MatchmakingCancelledEvents);
        $('#'+this._domId).find(".simulateMatchmakingOutput span.matchmakingFailedEvents").html(simulation.MatchmakingFailedEvents);
    }
}