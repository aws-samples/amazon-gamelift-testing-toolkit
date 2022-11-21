// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";

export class SimulateMatchmakingTickets extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_TICKETS;
    public static cacheKey = "simulateMatchmakingTickets";
    protected _currentSimulation;
    protected _ticketEvents: any[];

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingTickets.cacheKey,  parentPage, SimulateMatchmakingTickets.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);


        if (el.attr("id")=="backToSimulationOutput")
        {
            this.goBack(this._currentSimulation);
        }
        else
        if (el.attr("id") == "backButton")
        {
            this.backToMatchmakingTicketsList();
        }
        else
        if (el.attr("id") == "eventDetailBackButton") // back to event list
        {
            this.backToMatchmakingTicketEventList();
        }
        else
        if (el.hasClass("viewTicketEvent"))
        {
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == el.attr("id"));
            this.showEventDetail(ticketEvent);
        }
        else
        if (el.hasClass("viewTicket"))
        {
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
    }

    public setPageData(data:any)
    {
        this._currentSimulation = data;
    }


    initPage() {
        Network.sendObject({Type:"GetMatchmakingTicketHeadersBySimulationId", SimulationId:this._currentSimulation.SimulationId});
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, this.onGetMatchmakingTicketHeadersBySimulationIdResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, this.onGetMatchmakingTicketHeadersBySimulationIdResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    onGetMatchmakingTicketHeadersBySimulationIdResponse = (data) =>
    {
        let html="";

        let matchData = {successfulMatches:{}, failedMatches:[]};

        data.TicketHeaders?.map(header =>
        {
            let viewEventsTd='<td><a class="viewTicket btn btn-primary btn-sm" id="' + header.TicketId +'" href="' + "#" + '">View Events</a></td>';
            let viewQueueEventsTd='<td><a class="viewQueueEvent btn btn-primary btn-sm" id="' + header.MatchId +'" href="' + "#" + '">View Queue Event</a></td>';

            if (header.MatchId==undefined)
            {
                matchData.failedMatches.push(header);
            }
            else
            {
                if (matchData.successfulMatches[header.MatchId]==undefined)
                {
                    matchData.successfulMatches[header.MatchId]={tickets:[], numPlayers:0};
                }

                if (header.LastEventType=="MatchmakingSucceeded")
                {
                    matchData.successfulMatches[header.MatchId].tickets.push(header);
                    matchData.successfulMatches[header.MatchId].numPlayers++;
                }
            }

            if (header.LastEventType==null)
            {
                header.LastEventType="-";
            }
            html += '<tr>' +
                '<td>' + header.Time + '</td>'+
                '<td>' + header.TicketId + '</td>'+
                '<td>' + header.LastEventType + '</td>'+
                '<td>' + header.Events.length + '</td>'+
                viewEventsTd +
                '</tr>';
        });

        this.resetTicketHeadersTable();

        $('#'+this._domId).find("table#matchmakingTicketHeadersTable tbody").html(html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    resetTicketHeadersTable()
    {
        this.resetElement(".matchmakingTicketHeadersContent");
    }

    onGetMatchmakingTicketResponse = (ticket) => {
        let html = "";

        this._ticketEvents = ticket.Ticket.Events;

        this._ticketEvents.map(ticketEvent => {
            let viewEventDetailTd = '<td><a class="viewTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id + '" href="' + "#" + '">View Detail</a></td>';
            html += '<tr>' +
                '<td>' + ticketEvent.time + '</td>' +
                '<td>' + ticketEvent.detail.type + '</td>' +
                viewEventDetailTd +
                '</tr>'
        });

        this.resetEventsTable();

        $('#' + this._domId).find("table#matchmakingTicketEventsTable tbody").html(html);

        this.hideMatchmakingTicketsList();
        this.showMatchmakingTicketEventList();
        this.activateDataTable("matchmakingTicketEventsTable");
    }

    resetEventsTable()
    {
        this.resetElement(".matchmakingTicketEventsContent");
    }

    hideMatchmakingTicketsList()
    {
        $('#'+this._domId).find(".matchmakingTicketHeadersContent").hide();
    }

    showMatchmakingTicketJson()
    {
        $('#'+this._domId).find(".matchmakingTicketEventDetailContent").show();
    }

    hideMatchmakingTicketJson()
    {
        $('#'+this._domId).find(".matchmakingTicketEventDetailContent").hide();
    }

    showMatchmakingTicketsList()
    {
        $('#'+this._domId).find(".matchmakingTicketHeadersContent").show();
    }

    showMatchmakingTicketEventList()
    {
        $('#'+this._domId).find(".matchmakingTicketEventsContent").show();
    }

    hideMatchmakingTicketEventList()
    {
        $('#'+this._domId).find(".matchmakingTicketEventsContent").hide();
    }

    backToMatchmakingTicketsList()
    {
        this.showMatchmakingTicketsList();
        this.hideMatchmakingTicketEventList();
        this.resetEventsTable();
    }

    backToMatchmakingTicketEventList()
    {
        this.showMatchmakingTicketEventList();
        this.hideMatchmakingTicketJson();
        this.resetJson();
    }

    resetJson()
    {
        $('#'+this._domId).find("#matchmakingTicketEventJson").html("");
    }

    showEventDetail = (ticketEvent) =>
    {
        const container = document.getElementById("matchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideMatchmakingTicketEventList();
        this.showMatchmakingTicketJson();
    }
}