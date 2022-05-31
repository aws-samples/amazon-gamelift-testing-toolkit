// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Fleet} from "../Fleet";
import DOMElement = Phaser.GameObjects.DOMElement;
import {Network} from "../../Network/Network";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Rectangle = Phaser.GameObjects.Rectangle;
import config from "../../Config/Config"
import {Popup} from "../Abstract/Popup";
import Instance = DataTypes.Instance;
import GameSession = DataTypes.GameSession;
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

        this._popup.node.querySelector("table#matchmakingTicketHeadersTable tbody").insertAdjacentHTML("beforeend", html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    onGetQueueEventResponse = (event) =>
    {
        console.log(event);

        const container = document.getElementById("queueEventJson")
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
        console.log(ticket);
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

        console.log(html);

        this._popup.node.querySelector("table#matchmakingTicketEventsTable tbody").insertAdjacentHTML("beforeend", html);

        this.hideMatchmakingTicketsList();
        this.showMatchmakingTicketEventList();
        this.hideRefreshButton();
        this.activateDataTable("matchmakingTicketEventsTable");
    };

    resetTable()
    {
        /*
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#matchmakingTicketHeadersTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#matchmakingTicketHeadersTable")==null)
        {
            this._popup.node.querySelector(".matchmakingTicketHeadersContent")?.appendChild(element.querySelector("#matchmakingTicketHeadersTable"));
        }*/

        this.resetElement(".matchmakingTicketHeadersContent")
    }

    resetEventsTable()
    {
        /*
        console.log(this._html);
        //const original = new DOMElement(this.scene, 0, 0).createFromCache(this._htmlName);
        console.log(this._popup.node.querySelector("table#matchmakingTicketEventsTable").outerHTML);
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#matchmakingTicketEventsTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#matchmakingTicketEventsTableTable")==null)
        {
            this._popup.node.querySelector(".matchmakingTicketEventsContent")?.appendChild(element.querySelector("#matchmakingTicketEventsTable"));
        }*/
        this.resetElement(".matchmakingTicketEventsContent")
    }

    resetElement(selector)
    {
        let el = $(this._html);
        $(selector).html(el.find(selector).html());
    }

    resetJson()
    {
        this._popup.node.querySelector("#matchmakingTicketEventJson").innerHTML="";
    }

    resetQueueEventJson()
    {
        this._popup.node.querySelector("#queueEventJson").innerHTML="";
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
            console.log("VIEWING TICKET DETAIL!");
            console.log(event.target.id);
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showEventDetail(ticketEvent);
        }
        else
        if (event.target.className.indexOf("viewTicket") !== -1)
        {
            console.log("VIEWING TICKET!");
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
        else
        if (event.target.className.indexOf("viewQueueEvent") !== -1)
        {
            console.log("VIEWING QUEUE EVENT!", event.target.id);
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

    showEventDetail = (ticketEvent) =>
    {
        console.log(ticketEvent);

        const container = document.getElementById("matchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideMatchmakingTicketEventList();
        this.showMatchmakingTicketJson();
        this.hideRefreshButton();
    }

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
        this._popup.node.querySelector(".matchmakingTicketEventDetailContent").className="matchmakingTicketEventDetailContent";
    }

    hideMatchmakingTicketJson()
    {
        this._popup.node.querySelector(".matchmakingTicketEventDetailContent").className="matchmakingTicketEventDetailContent hide";
    }

    showQueueEventJson()
    {
        this._popup.node.querySelector(".queueEventDetailContent").className="queueEventDetailContent";
    }

    hideQueueEventJson()
    {
        this._popup.node.querySelector(".queueEventDetailContent").className="queueEventDetailContent hide";
    }

    showMatchmakingTicketsList()
    {
        this._popup.node.querySelector(".matchmakingTicketHeadersContent").className="matchmakingTicketHeadersContent";
    }

    hideMatchmakingTicketsList()
    {
        this._popup.node.querySelector(".matchmakingTicketHeadersContent").className="matchmakingTicketHeadersContent hide";
    }

    showMatchmakingTicketEventList()
    {
        this._popup.node.querySelector(".matchmakingTicketEventsContent").className="matchmakingTicketEventsContent";
    }

    hideMatchmakingTicketEventList()
    {
        this._popup.node.querySelector(".matchmakingTicketEventsContent").className="matchmakingTicketEventsContent hide";
    }

    refresh()
    {
        Network.sendObject({Type:"GetMatchmakingTicketHeaders", MatchmakingConfigArn:this._matchmakingConfigArn});
    }

    showRefreshButton()
    {
        this._popup.node.querySelector(".refreshButton").className="refreshButton";
    }

    hideRefreshButton()
    {
        this._popup.node.querySelector(".refreshButton").className="refreshButton hide";
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