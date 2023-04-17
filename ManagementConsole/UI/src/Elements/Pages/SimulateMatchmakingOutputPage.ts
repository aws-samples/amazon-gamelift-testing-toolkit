// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {PageManager} from "./PageManager";
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";

export class SimulateMatchmakingOutputPage extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_OUTPUT;
    public static cacheKey = this.id;
    protected _currentSimulation;
    protected _intervalId;

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingOutputPage.cacheKey,  parentPage, SimulateMatchmakingOutputPage.id);
        this.getSimulationData = this.getSimulationData.bind(this);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("backToMatchmakingSimulations")) // back to simulations table
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
        this.selector.find(".simulateMatchmakingOutput p.simulationErrors").html("");

        if (simulation.PlayersMatched + simulation.PlayersFailed == totalPlayers)
        {
            this.stopPolling();
            this.selector.find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation Complete");
            this.selector.find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("failedBg").removeClass("inProgressBg").addClass("completeBg");
            this.selector.find("#showSimulationResults").show();
            this.selector.find("#showSimulationTickets").show();
        }
        else
        if (simulation.Status=="Failed")
        {
            this.stopPolling();
            this.selector.find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation Failed");
            this.selector.find(".simulateMatchmakingOutput p.simulationErrors").html(simulation.Errors.join("<br/>"));
            this.selector.find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("completeBg").removeClass("inProgressBg").addClass("failedBg");
            this.selector.find("#showSimulationResults").show();
            this.selector.find("#showSimulationTickets").show();
        }
        else
        {
            this.selector.find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation In Progress");
            this.selector.find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("failedBg").removeClass("completeBg").addClass("inProgressBg");
        }

        this.selector.find(".simulateMatchmakingOutput span.simulationDate").html(simulation.Date);
        this.selector.find(".simulateMatchmakingOutput span.totalPlayers").html(totalPlayers.toString());
        this.selector.find(".simulateMatchmakingOutput span.totalEvents").html(totalEvents.toString());
        this.selector.find(".simulateMatchmakingOutput span.totalMatchAttempts").html(totalMatchAttempts.toString());
        this.selector.find(".simulateMatchmakingOutput span.playersMatched").html(simulation.PlayersMatched + '/' + totalPlayers);
        this.selector.find(".simulateMatchmakingOutput span.playersMatchFailed").html(simulation.PlayersFailed + '/' + totalPlayers);
        this.selector.find(".simulateMatchmakingOutput span.matchesMade").html(simulation.MatchesMade + '/' + totalMatchAttempts);
        this.selector.find(".simulateMatchmakingOutput span.matchmakingSearchingEvents").html(simulation.MatchmakingSearchingEvents);
        this.selector.find(".simulateMatchmakingOutput span.potentialMatchCreatedEvents").html(simulation.PotentialMatchCreatedEvents);
        this.selector.find(".simulateMatchmakingOutput span.matchmakingSucceededEvents").html(simulation.MatchmakingSucceededEvents);
        this.selector.find(".simulateMatchmakingOutput span.matchmakingTimedOutEvents").html(simulation.MatchmakingTimedOutEvents);
        this.selector.find(".simulateMatchmakingOutput span.matchmakingCancelledEvents").html(simulation.MatchmakingCancelledEvents);
        this.selector.find(".simulateMatchmakingOutput span.matchmakingFailedEvents").html(simulation.MatchmakingFailedEvents);
    }
}