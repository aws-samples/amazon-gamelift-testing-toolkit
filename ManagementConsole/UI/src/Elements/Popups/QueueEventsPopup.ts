// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSessionQueue = DataTypes.GameSessionQueue;
import QueuePlacementEventDetail = DataTypes.QueuePlacementEventDetail;
import {Utils} from "../../Utils/Utils";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';

export class QueueEventsPopup extends Popup
{
    protected _queueEvents: QueuePlacementEventDetail[];
    protected _queue:GameSessionQueue;
    protected _ticketEvents: any[];

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="queueEventsPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this._queue = data.gameObject.Data as GameSessionQueue;
        this.refresh();
    }

    refresh()
    {
        Network.sendObject({Type:"GetQueueEvents", QueueArn:this._queue.GameSessionQueueArn});
    }

    resetTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#queueEventsTable_wrapper").remove();
        if (this.element.find("table#queueEventsTable").length==0)
        {
            this.element.find(".queueEventsContent").append(element.querySelector("#queueEventsTable"));
        }
    }

    resetTicketHeadersTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#matchmakingTicketHeadersTable_wrapper").remove();
        if (this.element.find("table#matchmakingTicketHeadersTable").length==0)
        {
            this.element.find(".matchmakingTicketHeadersContent").append(element.querySelector("#matchmakingTicketHeadersTable"));
        }
    }

    resetTicketEventJson()
    {
        this.element.find("#matchmakingTicketEventJson").html("");
    }

    resetTicketEventsTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#matchmakingTicketEventsTable_wrapper").remove();
        if (this.element.find("table#matchmakingTicketEventsTableTable").length==0)
        {
            this.element.find(".matchmakingTicketEventsContent").append(element.querySelector("#matchmakingTicketEventsTable"));
        }
    }

    onGetMatchmakingTicketHeadersResponse = (data) =>
    {
        let html="";

        this.showMatchmakingTicketsList();
        this.hideQueueEventsList();

        data.TicketHeaders?.map(header =>
        {
            let viewEventsTd='<td><a class="viewTicket btn btn-primary btn-sm" id="' + header.TicketId +'" href="' + "#" + '">View Events</a></td>';
            let viewQueueEventsTd='<td><a class="viewQueueEvent btn btn-primary btn-sm" id="' + header.MatchId +'" href="' + "#" + '">View Queue Event</a></td>';

            if (header.MatchId==undefined)
            {
                viewQueueEventsTd='<td></td>';
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

        this.element.find("table#matchmakingTicketHeadersTable tbody").append(html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    onGetMatchmakingTicketResponse = (ticket) =>
    {
        let html="";

        this._ticketEvents = ticket.Ticket.Events;

        this._ticketEvents.map(ticketEvent => {
            let viewEventDetailTd='<td><a class="viewTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id +'" href="' + "#" + '">View Detail</a></td>';
            html += '<tr>' +
                '<td>' + ticketEvent.time + '</td>'+
                '<td>' + ticketEvent.detail.type + '</td>'+
                viewEventDetailTd +
                '</tr>'
        });

        this.element.find("table#matchmakingTicketEventsTable tbody").append(html);

        this.hideMatchmakingTicketsList();
        this.showMatchmakingTicketEventList();
        this.hideRefreshButton();
        this.activateDataTable("matchmakingTicketEventsTable");
    };

    setupEventListeners()
    {
        this._emitter.on(Events.GET_QUEUE_EVENTS_RESPONSE, this.onGetQueueEventsResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetMatchmakingTicketHeadersResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_QUEUE_EVENTS_RESPONSE, this.onGetQueueEventsResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetMatchmakingTicketHeadersResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    onGetQueueEventsResponse = (data:QueuePlacementEventDetail[]) =>
    {
        this._queueEvents = data;

        let html="";
        data.map(queueEvent =>
        {
            let queueDetailLinkTd='<td><a class="viewDetail btn btn-primary btn-sm" id="' + queueEvent.placementId +'" href="' + "#" + '">View Detail</a></td>';
            let matchmakingTicketsTd='<td><a class="viewMatchmakingTickets btn btn-primary btn-sm" id="' + queueEvent.placementId +'" href="' + "#" + '">View Matchmaking Tickets</a></td>';
            let placementDuration = "-";
            if (queueEvent.startTime!=null && queueEvent.endTime>queueEvent.startTime)
            {
                let startTime = new Date(queueEvent.startTime);
                let endTime = new Date(queueEvent.endTime);
                let secondsDuration = Math.round((endTime.getTime() - startTime.getTime())/1000);
                placementDuration = Utils.secondsToDuration(secondsDuration);
            }

            html += '<tr>' +
                '<td>' + queueEvent.startTime + '</td>'+
                '<td>' + queueEvent.type + '</td>'+
                '<td>' + placementDuration + '</td>'+
                queueDetailLinkTd +
                matchmakingTicketsTd +
                '</tr>';
        });

        this.resetTable();

        this.element.find("table#queueEventsTable tbody").append(html);
        this.activateDataTable("queueEventsTable");
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }
        else if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else if (event.target.id == "backToQueueEventList")
        {
            this.backToQueueEventList();
        }
        else if (event.target.id == "backToTicketList")
        {
            this.backToTicketList();
        }
        else if (event.target.id == "backToTicketEventList")
        {
            this.backToMatchmakingTicketEventList();
        }
        else if (event.target.className.indexOf("viewDetail") !== -1) {
            let queueEvent = this._queueEvents.filter(queueEvent => queueEvent.placementId == event.target.id)[0];
            this.showEventDetail(queueEvent);
            this.hideRefreshButton();
        }
        else if (event.target.className.indexOf("viewTicketEvent") !== -1)
        {
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showTicketEventDetail(ticketEvent);
        }
        else if (event.target.className.indexOf("viewTicket") !== -1)
        {
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
        else if (event.target.className.indexOf("viewMatchmakingTickets") !== -1)
        {
            Network.sendObject({Type:"GetMatchmakingTicketHeadersByMatchId", MatchId:event.target.id});
        }
    }

    showEventDetail = (queueEvent) =>
    {
        const container = document.getElementById("queueEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"Queue Placement Event"}

        const editor = new JSONEditor(container, options);

        editor.set(queueEvent);

        this.hideQueueEventsList();
        this.showQueueEventJson();
    }

    showTicketEventDetail = (ticketEvent) =>
    {
        const container = document.getElementById("matchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideMatchmakingTicketEventList();
        this.showMatchmakingTicketJson();
        this.hideRefreshButton();
    }

    showMatchmakingTicketJson()
    {
        this.element.find(".matchmakingTicketEventDetailContent").attr("class","matchmakingTicketEventDetailContent");
    }

    hideMatchmakingTicketJson()
    {
        this.element.find(".matchmakingTicketEventDetailContent").attr("class","matchmakingTicketEventDetailContent hide");
    }

    resetJson()
    {
        this.element.find("#queueEventJson").html("");
    }

    backToQueueEventList()
    {
        this.hideQueueEventJson();
        this.showQueueEventsList();
        this.hideMatchmakingTicketsList();
        this.showRefreshButton();
        this.resetJson();
    }

    backToTicketList()
    {
        this.hideQueueEventJson();
        this.hideQueueEventsList();
        this.showMatchmakingTicketsList();
        this.hideMatchmakingTicketEventList();
        this.resetTicketEventsTable();
        this.hideRefreshButton();
        this.resetJson();
    }

    backToMatchmakingTicketEventList()
    {
        this.showMatchmakingTicketEventList();
        this.hideMatchmakingTicketJson();
        this.hideQueueEventJson();
        this.resetJson();
        this.resetTicketEventJson();
    }

    showRefreshButton()
    {
        this.element.find(".refreshButton").attr("class","refreshButton");
    }

    hideRefreshButton()
    {
        this.element.find(".refreshButton").attr("class","refreshButton hide");
    }

    showQueueEventsList()
    {
        this.element.find(".queueEventsContent").attr("class","queueEventsContent");
    }

    hideQueueEventsList()
    {
        this.element.find(".queueEventsContent").attr("class","queueEventsContent hide");
    }

    showQueueEventJson()
    {
        this.element.find(".queueEventDetailContent").attr("class","queueEventDetailContent");
    }

    hideQueueEventJson()
    {
        this.element.find(".queueEventDetailContent").attr("class","queueEventDetailContent hide");
    }

    showMatchmakingTicketsList()
    {
        this.element.find(".matchmakingTicketHeadersContent").attr("class","matchmakingTicketHeadersContent");
    }

    hideMatchmakingTicketsList()
    {
        this.element.find(".matchmakingTicketHeadersContent").attr("class","matchmakingTicketHeadersContent hide");
    }

    showMatchmakingTicketEventList()
    {
        this.element.find(".matchmakingTicketEventsContent").attr("class","matchmakingTicketEventsContent");
    }

    hideMatchmakingTicketEventList()
    {
        this.element.find(".matchmakingTicketEventsContent").attr("class","matchmakingTicketEventsContent hide");
    }

    activateDataTable(id) {
        // @ts-ignore
        $('#'+id).DataTable({
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            order: [[ 0, "desc" ]]
        });
    }
}