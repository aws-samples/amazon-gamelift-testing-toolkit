// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {Utils} from "../../Utils/Utils";

export class SimulateMatchmakingMatchInfoPage extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_MATCH_INFO;
    public static cacheKey = this.id;
    protected _currentSimulation: any;
    protected _currentMatchId : string;
    protected _matches: Record<string, any>;
    protected _failedPlayers: any[]=[];
    protected _ticketEvents:any[];

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingMatchInfoPage.cacheKey,  parentPage, SimulateMatchmakingMatchInfoPage.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("backToMatchResults"))
        {
            this.goBack(this._currentSimulation);
        }
        else if (el.attr("id")=="backToSuccessfulMatchTickets")
        {
            this.resetSuccessfulMatchTicketEventTable();
            this.showSuccessfulMatchTicketsList();
            this.hideSuccessfulMatchTicketEventList();
        }
        else if (el.hasClass("viewSuccessfulMatchTickets"))
        {
            Network.sendObject({Type:"GetMatchmakingTicketHeadersByMatchId", MatchId:event.target.dataset.matchid});
        }
        else if (el.hasClass("viewSuccessfulMatchTicket"))
        {
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
        else
        if (el.hasClass("viewSuccessfulMatchTicketEvent"))
        {
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showSuccessfulMatchTicketEventDetail(ticketEvent);
        }
        else
        if (el.attr("id")=="successfulMatchTicketEventDetailBackButton") // back to event list
        {
            this.backToSuccessfulMatchTicketEventList();
        }
    }

    public setPageData(data:any)
    {
        this._currentSimulation = data.currentSimulation;
        this._currentMatchId = data.currentMatchId;
        this._matches = data.matches;
    }

    initPage() {
        this.resetPage();
        Network.sendObject({Type:"GetMatchmakingTicketHeadersByMatchId", MatchId:this._currentMatchId});
        this.populateMatchInfo(this._currentMatchId);
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_SIMULATION_MATCHES_RESPONSE, this.onGetSimulationMatchesResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetSimulationSuccessfulMatchTicketsResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_SIMULATION_MATCHES_RESPONSE, this.onGetSimulationMatchesResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetSimulationSuccessfulMatchTicketsResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    onGetSimulationMatchesResponse = (matchResults) =>
    {
        let successHtml="";
        this._matches = {};
        this._failedPlayers=[];
        let successfulMatches=0;
        let failedMatches=0;

        matchResults.map(matchResult => {
            this._matches[matchResult.MatchId] = matchResult;
            let matchPlayerText="";
            let matchPlayers={};
            let totalMatchTime=0;
            let totalPlayers=0;
            matchResult.Players.map(player =>
            {
                let timeTaken = player.EndMatchTime - player.StartMatchTime;
                totalMatchTime+=timeTaken;
                if (matchPlayers[player.MatchedTeam]==undefined)
                {
                    matchPlayers[player.MatchedTeam]={};
                }
                if (matchPlayers[player.MatchedTeam][player["ProfileName"]]==undefined)
                {
                    matchPlayers[player.MatchedTeam][player["ProfileName"]]=0;
                }
                matchPlayers[player.MatchedTeam][player["ProfileName"]]++;
                totalPlayers++;
            });

            Object.keys(matchPlayers).map(matchedTeam=>
            {
                if (matchResult.MatchedSuccessfully)
                {
                    matchPlayerText += matchedTeam +" - ";
                }
                Object.keys(matchPlayers[matchedTeam]).map(matchedProfile=>
                {
                    matchPlayerText+= matchPlayers[matchedTeam][matchedProfile] + " " + matchedProfile + ", ";
                });
                matchPlayerText = matchPlayerText.slice(0,matchPlayerText.length-2);
                matchPlayerText+="<br/>";
            });

            if (matchResult.MatchedSuccessfully)
            {
                successfulMatches++;
                successHtml += '<tr>' +
                    '<td>' + matchResult.Date + '</td>'+
                    '<td>' + matchResult.MatchId + '</td>'+
                    '<td>' + matchPlayerText + '</td>'+
                    '<td>' + (totalMatchTime/totalPlayers).toFixed(1) + ' seconds</td>'+
                    '<td><a class="viewMatchInfo btn btn-primary btn-sm" id="' + matchResult.MatchId +'" href="' + "#" + '">Match Info</a></td>' +
                    '</tr>';
            }
            else
            {
                failedMatches++;
                matchResult.Players[0]["MatchTicketStatus"]=matchResult.MatchTicketStatus;
                this._failedPlayers.push(matchResult.Players[0]);
            }
        });

        this.resetSuccessfulMatchesTable();
        this.resetSuccessfulMatchTicketEventTable();

        this.selector.find("table#successfulMatchesTable tbody").html(successHtml);

        //this.hideMatchmakingTicketsList();
        this.showMatchResults();
        this.activateDataTable("successfulMatchesTable");

        if (successfulMatches==0)
        {
            this.hideSuccessfulMatchesList();
        }
        else
        {
            this.showSuccessfulMatchesList();
        }
    }

    onGetSimulationSuccessfulMatchTicketsResponse = (data) =>
    {
        let html="";

        data.TicketHeaders?.map(header =>
        {
            let viewEventsTd='<td><a class="viewSuccessfulMatchTicket btn btn-primary btn-sm" id="' + header.TicketId +'" href="' + "#" + '">View Ticket Events</a></td>';

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

        this.resetSuccessfulMatchTicketsTable();
        this.selector.find("table#successfulMatchTicketHeadersTable tbody").html(html);
    }


    populateMatchInfo = (matchId) =>
    {
        this.resetMatchInfoPlayersTable();
        let match = this._matches[matchId];

        this.selector.find("a.viewRuleEvaluationMetrics").attr("data-matchid", matchId);
        this.selector.find("a.viewSuccessfulMatchTickets").attr("data-matchid", matchId);

        let matchPlayerTableHtml="";
        let columnToggleHtml="Toggle column: ";

        if (match.Players.length)
        {
            let playerAttributes=[];
            let showLatencyData=false;

            match.Players.map(player=>
            {
                Object.keys(player.PlayerData.PlayerAttributes).map(playerAttributeName =>
                {
                    if (playerAttributes.indexOf(playerAttributeName)==-1)
                    {
                        playerAttributes.push(playerAttributeName);
                    }
                });

                if (player.PlayerData.LatencyInMs!=null && Object.keys(player.PlayerData.LatencyInMs).length)
                {
                    showLatencyData=true;
                }
            });

            columnToggleHtml+='<a class="toggle-vis" data-column="2">Player ID</a> - ';
            columnToggleHtml+='<a class="toggle-vis" data-column="3">Match Time</a> - ';
            let i=3;
            playerAttributes.map(playerAttributeName =>
            {
                i++;
                this.selector.find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">' + playerAttributeName + '</a> - ';
            });

            if (showLatencyData)
            {
                i++;
                this.selector.find("#matchInfoPlayersTable >thead tr").append("<th>Latency</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">Latency</a> - ';
            }

            columnToggleHtml = columnToggleHtml.slice(0,columnToggleHtml.length-2);

            match.Players.map(player=>
            {
                let attributeHtml="";
                playerAttributes.map(playerAttributeName =>
                {
                    let playerAttribute = player.PlayerData.PlayerAttributes[playerAttributeName];
                    attributeHtml+= "<td>" + Utils.getPlayerAttributeText(playerAttribute) + "</td>";
                    //this.selector.find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");

                });

                if (showLatencyData)
                {
                    attributeHtml+="<td>" + JSON.stringify(player.PlayerData.LatencyInMs) + "</td>";
                }

                matchPlayerTableHtml += '<tr>' +
                    '<td>' + player.MatchedTeam + '</td>'+
                    '<td>' + player.ProfileName + '</td>'+
                    '<td>' + player.PlayerId + '</td>'+
                    '<td>' + (player.EndMatchTime-player.StartMatchTime) + ' seconds</td>'+
                    attributeHtml +
                    '</tr>'
            });

            this.selector.find("table#matchInfoPlayersTable tbody").html(matchPlayerTableHtml);



            let table = this.activateDataTable("matchInfoPlayersTable", {
                scrollY: "400px",
                scrollCollapse: true,
                dom: "Bfrtip",
                buttons: {
                    dom: {
                        button: {
                            tag: 'button',
                            className: 'border-0'
                        },
                        buttonLiner: {
                            tag: null
                        }
                    },
                    buttons : [
                        {
                            extend: "copyHtml5",
                            text:   '<i style="font-size:26px; color:#333" class="fa fa-copy"></i>',
                            titleAttr: 'Copy'
                        },
                        {
                            extend: "csvHtml5",
                            text:      '<i style="font-size:26px; color:#333" class="fa fa-file-csv"></i>',
                            titleAttr: 'CSV'
                        }
                    ],
                },
                order: [[
                    0, "desc" ]],
            });

            this.selector.find("div.matchedPlayers div.columnToggle").html(columnToggleHtml);
            this.selector.find("div.matchedPlayers div.columnToggle a.toggle-vis").on("click", function (e)  {
                e.preventDefault();
                let column = table.column($(this).attr("data-column"));

                column.visible(!column.visible());
                table.columns.adjust().draw();
            });

            this.selector.find("select.selectMatchInfo").on("change",   (e) =>{
                e.preventDefault();
                let selectedValue = $(e.target).val();

                switch(selectedValue)
                {
                    case "matchedPlayers":
                        this.showMatchPlayers();
                        this.hideRuleEvaluationMetrics();
                        this.hideMatchTickets();
                        break;
                    case "ruleMetrics":
                        this.hideMatchPlayers();
                        this.showRuleEvaluationMetrics();
                        this.activateDataTable("ruleEvaluationMetricsTable");
                        this.hideMatchTickets();
                        break;
                    case "matchTickets":
                        this.hideMatchPlayers();
                        this.hideRuleEvaluationMetrics();
                        this.showMatchTickets();
                        this.activateDataTable("successfulMatchTicketHeadersTable");
                        break;
                }
            });

            this.populateRuleEvaluationMetricsList(matchId);
        }
    }



    populateRuleEvaluationMetricsList = (matchId) =>
    {
        let html="";
        let metrics = this._matches[matchId].RuleEvaluationMetrics;

        if (metrics!=null)
        {
            metrics.map(matchResult => {
                this._matches[matchResult.MatchId] = matchResult;
                html += '<tr>' +
                    '<td>' + matchResult.ruleName + '</td>'+
                    '<td>' + matchResult.passedCount + '</td>'+
                    '<td>' + matchResult.failedCount + '</td>'+
                    '</tr>'
            });
        }

        this.resetRuleEvaluationMetricsTable();

        this.selector.find("table#ruleEvaluationMetricsTable tbody").html(html);
    }

    onGetMatchmakingTicketResponse = (ticket) =>
    {
        this._ticketEvents = ticket.Ticket.Events;

        let html="";

        this._ticketEvents.map(ticketEvent => {
            let viewEventDetailTd='<td><a class="viewSuccessfulMatchTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id +'" href="' + "#" + '">View Detail</a></td>';
            html += '<tr>' +
                '<td>' + ticketEvent.time + '</td>'+
                '<td>' + ticketEvent.detail.type + '</td>'+
                viewEventDetailTd +
                '</tr>'
        });

        this.selector.find("table#successfulMatchmakingTicketEventsTable tbody").html(html);
        this.hideSuccessfulMatchTicketsList();
        this.showSuccessfulMatchTicketEventList();
        this.activateDataTable("successfulMatchmakingTicketEventsTable");
    };

    showSuccessfulMatchTicketEventDetail = (ticketEvent) =>
    {
        const container = document.getElementById("successfulMatchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideSuccessfulMatchTicketEventList();
        this.showSuccessfulMatchTicketJson();
    }

    showSuccessfulMatchTicketJson()
    {
        this.selector.find(".successfulMatchTicketEventDetailContent").show();
    }

    hideSuccessfulMatchTicketJson()
    {
        this.selector.find(".successfulMatchTicketEventDetailContent").hide();
    }

    resetSuccessfulMatchesTable()
    {
        this.resetElement(".successfulMatchesContent");
    }

    resetSuccessfulMatchTicketsTable()
    {
        this.resetElement(".successfulMatchTicketHeadersContent");
    }

    resetSuccessfulMatchTicketEventTable()
    {
        this.resetElement(".successfulMatchTicketEventsContent");
    }

    resetRuleEvaluationMetricsTable()
    {
        this.resetElement(".ruleEvaluationMetricsContent");
    }

    resetMatchInfoPlayersTable()
    {
        this.resetElement(".matchInfoPlayersContent");
    }

    resetMatchInfo()
    {
        this.resetElement(".matchInfo");
    }

    // Hide/Show for <select> panes

    showMatchPlayers()
    {
        $('.matchedPlayers').show();
    }

    hideMatchPlayers()
    {
        $('.matchedPlayers').hide();
    }

    showRuleEvaluationMetrics()
    {
        $('.ruleEvaluationMetrics').show();
    }

    hideRuleEvaluationMetrics()
    {
        $('.ruleEvaluationMetrics').hide();
    }

    showMatchResults()
    {
        this.selector.find(".matchResultsContent").show();
    }

    hideMatchResults()
    {
        this.selector.find(".matchResultsContent").hide();
    }

    showMatchInfo()
    {
        this.resetMatchInfo();
        this.selector.find(".matchInfo").show();
        this.hideMatchResults();
    }

    showMatchTickets()
    {
        this.selector.find(".matchTickets").show();
        this.hideMatchResults();
    }

    hideMatchTickets()
    {
        this.selector.find(".matchTickets").hide();
    }

    showMatchInfoHeader()
    {
        this.selector.find(".matchInfoHeader").show();
    }

    hideMatchInfoHeader()
    {
        this.selector.find(".matchInfoHeader").hide();
    }

    // Hide show for match tickets list

    showSuccessfulMatchTicketsList()
    {
        this.showMatchInfoHeader();
        this.selector.find(".successfulMatchTicketHeadersContent").show();
        this.hideMatchResults();
    }

    hideSuccessfulMatchTicketsList()
    {
        this.selector.find(".successfulMatchTicketHeadersContent").hide();
    }

    showSuccessfulMatchTicketEventList()
    {
        this.hideMatchInfoHeader();
        this.selector.find(".successfulMatchTicketEventsContent").show();
        this.hideMatchResults();
        this.hideSuccessfulMatchTicketsList();
    }

    hideSuccessfulMatchTicketEventList()
    {
        this.selector.find(".successfulMatchTicketEventsContent").hide();
    }

    showSuccessfulMatchesList()
    {
        this.selector.find(".successfulMatchesContent").show();
    }

    hideSuccessfulMatchesList()
    {
        this.selector.find(".successfulMatchesContent").hide();
    }

    hideMatchInfo()
    {
        this.selector.find(".matchInfo").hide();
    }

    backToSuccessfulMatchTicketEventList()
    {
        this.showSuccessfulMatchTicketEventList();
        this.hideSuccessfulMatchTicketJson();
        this.resetSuccessfulMatchJson();
    }

    resetSuccessfulMatchJson()
    {
        this.selector.find("#successfulMatchmakingTicketEventJson").html("");
    }
}