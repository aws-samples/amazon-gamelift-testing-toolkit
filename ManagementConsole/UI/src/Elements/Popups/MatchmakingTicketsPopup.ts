// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import JSONEditor, {JSONEditorOptions} from "jsoneditor";

export class MatchmakingTicketsPopup extends Popup
{
    protected _ticketEvents: any[];
    protected _matchmakingConfigArn: string;

    constructor (scene:Phaser.Scene, x:number, y:number, matchmakingConfigArn:string)
    {
        super(scene, x, y);
        this._htmlName="matchmakingTicketHeadersTablePopup";
        this._matchmakingConfigArn = matchmakingConfigArn;
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    onGetMatchmakingTicketHeadersResponse = (data) =>
    {
        let html="";

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
                viewQueueEventsTd +
                '</tr>';
        });

        this.resetTable();
        this.element.find("table#matchmakingTicketHeadersTable tbody").append(html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    showEventDetail = (ticketEvent) =>
    {
        const container = this.element.find("#matchmakingTicketEventJson")[0];
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideMatchmakingTicketEventList();
        this.showMatchmakingTicketJson();
        this.hideRefreshButton();
    }

    onGetQueueEventResponse = (event) =>
    {
        const container = this.element.find("#queueEventJson")[0];
        const options:JSONEditorOptions = {mode:"view", name:"Queue Event"}

        const editor = new JSONEditor(container, options);
        editor.set(event);
        editor.expandAll();

        this.hideMatchmakingTicketsList();
        this.showQueueEventJson();
        this.hideRefreshButton();
    };

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

    resetTable()
    {
        this.resetElement(".matchmakingTicketHeadersContent")
    }

    resetEventsTable()
    {
        this.resetElement(".matchmakingTicketEventsContent")
    }

    resetElement(selector)
    {
        let el = $(this._html);
        $(selector).html(el.find(selector).html());
    }

    resetJson()
    {
        this.element.find("#matchmakingTicketEventJson").html("");
    }

    resetQueueEventJson()
    {
        this.element.find("#queueEventJson").html("");
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }

        if (event.target.className.indexOf("viewTicketEvent") !== -1)
        {
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showEventDetail(ticketEvent);
        }
        else
        if (event.target.className.indexOf("viewTicket") !== -1)
        {
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
        else
        if (event.target.className.indexOf("viewQueueEvent") !== -1)
        {
            Network.sendObject({Type:"GetQueueEventByPlacementId", PlacementId:event.target.id});
        }
        else
        if (event.target.id == "backButton")
        {
            this.backToMatchmakingTicketsList();
        }
        else
        if (event.target.id == "eventDetailBackButton")
        {
            this.backToMatchmakingTicketEventList();
        }
        else
        if (event.target.id == "queueEventBackButton")
        {
            this.backToMatchmakingTicketsList();
        }
    };

    setupEventListeners()
    {
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_RESPONSE, this.onGetMatchmakingTicketHeadersResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
        this._emitter.on(Events.GET_QUEUE_EVENT_BY_PLACEMENT_ID_RESPONSE, this.onGetQueueEventResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_RESPONSE, this.onGetMatchmakingTicketHeadersResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
        this._emitter.off(Events.GET_QUEUE_EVENT_BY_PLACEMENT_ID_RESPONSE, this.onGetQueueEventResponse);
    }

    showMatchmakingTicketJson()
    {
        this.element.find(".matchmakingTicketEventDetailContent").attr("class", "matchmakingTicketEventDetailContent");
    }

    hideMatchmakingTicketJson()
    {
        this.element.find(".matchmakingTicketEventDetailContent").attr("class","matchmakingTicketEventDetailContent hide");
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

    refresh()
    {
        Network.sendObject({Type:"GetMatchmakingTicketHeaders", MatchmakingConfigArn:this._matchmakingConfigArn});
    }

    showRefreshButton()
    {
        this.element.find(".refreshButton").attr("class","refreshButton");
    }

    hideRefreshButton()
    {
        this.element.find(".refreshButton").attr("class","refreshButton hide");
    }

    backToMatchmakingTicketEventList()
    {
        this.showMatchmakingTicketEventList();
        this.hideMatchmakingTicketJson();
        this.hideQueueEventJson();
        this.resetJson();
        this.resetQueueEventJson();
    }

    backToMatchmakingTicketsList()
    {
        this.showMatchmakingTicketsList();
        this.hideMatchmakingTicketEventList();
        this.resetEventsTable();
        this.resetQueueEventJson();
        this.hideQueueEventJson();
        this.showRefreshButton();
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