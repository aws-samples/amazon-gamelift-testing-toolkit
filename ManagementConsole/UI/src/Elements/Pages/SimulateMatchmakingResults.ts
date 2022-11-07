// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {PageManager} from "../Pages/PageManager";
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";

export class SimulateMatchmakingResults extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_RESULTS;
    public static url = "assets/html/fragments/simulateMatchmakingResults.html";
    protected _currentSimulation;
    protected _matches: Record<string, any>;
    protected _failedPlayers: any[]=[];

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingResults.url,  parentPage, SimulateMatchmakingResults.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.attr("id")=="backToSimulationOutput")
        {
            this.goBack(this._currentSimulation);
        }
        else
        if (el.hasClass("viewMatchInfo"))
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_MATCH_INFO, {currentSimulation:this._currentSimulation, currentMatchId:el.attr("id"), matches:this._matches});
        }
        else if (el.attr("id")=="backToSuccessfulMatchTickets")
        {
            this.resetSuccessfulMatchTicketEventTable();
            this.showSuccessfulMatchTicketsList();
            this.hideSuccessfulMatchTicketEventList();
        }
        else if (el.hasClass("viewFailedMatchInfo"))
        {
            this.hideMatchResults();
            this.showFailedMatchInfo();
        }
        else if (el.hasClass("viewFailedMatchTicket"))
        {
            console.log("View failed match ticket", event.target.id);
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_FAILED_TICKETS, {currentSimulation: this._currentSimulation, ticketId:event.target.id});

        }
    }

    public setPageData(data:any)
    {
        this._currentSimulation = data;
    }

    initPage() {
        this.resetPage();
        Network.sendObject({Type:"GetSimulationMatches", SimulationId:this._currentSimulation.SimulationId});
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_SIMULATION_MATCHES_RESPONSE, this.onGetSimulationMatchesResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetSimulationSuccessfulMatchTicketsResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_SIMULATION_MATCHES_RESPONSE, this.onGetSimulationMatchesResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetSimulationSuccessfulMatchTicketsResponse);
    }

    onGetSimulationMatchesResponse = (matchResults) =>
    {
        console.log("SIMULATION MATCHES RESPONSE", matchResults);
        let successHtml="";
        let failedHtml="";
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

        $('#'+this._domId).find("table#successfulMatchesTable tbody").html(successHtml);

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

        if (failedMatches==0)
        {
            this.hideFailedMatchesList();
        }
        else
        {
            this.showFailedMatchesList();
            this.populateFailedMatchInfo();
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
        $('#'+this._domId).find("table#successfulMatchTicketHeadersTable tbody").html(html);
    }


    populateMatchInfo = (matchId) =>
    {
        this.resetMatchInfoPlayersTable();
        let match = this._matches[matchId];
        console.log(match);

        $('#'+this._domId).find("a.viewRuleEvaluationMetrics").attr("data-matchid", matchId);
        $('#'+this._domId).find("a.viewSuccessfulMatchTickets").attr("data-matchid", matchId);

        let matchPlayerTableHtml="";
        let columnToggleHtml="Toggle column: ";

        if (match.Players.length)
        {
            let playerAttributes=[];
            let showLatencyData=false;

            match.Players.map(player=>
            {
                console.log(player);
                let attributeHtml="";

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
                $('#'+this._domId).find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">' + playerAttributeName + '</a> - ';
            });

            if (showLatencyData)
            {
                i++;
                $('#'+this._domId).find("#matchInfoPlayersTable >thead tr").append("<th>Latency</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">Latency</a> - ';
            }

            columnToggleHtml = columnToggleHtml.slice(0,columnToggleHtml.length-2);

            match.Players.map(player=>
            {
                console.log(player);
                let attributeHtml="";
                playerAttributes.map(playerAttributeName =>
                {
                    console.log(playerAttributeName);
                    let playerAttribute = player.PlayerData.PlayerAttributes[playerAttributeName];
                    console.log(playerAttribute);
                    attributeHtml+= "<td>" + this.getAttributeText(playerAttribute) + "</td>";
                    //$('#'+this._domId).find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");

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

            $('#'+this._domId).find("table#matchInfoPlayersTable tbody").html(matchPlayerTableHtml);



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

            $('#'+this._domId).find("div.matchedPlayers div.columnToggle").html(columnToggleHtml);
            $('#'+this._domId).find("div.matchedPlayers div.columnToggle a.toggle-vis").on("click", function (e)  {
                e.preventDefault();
                console.log("Toggled", e.target);
                let column = table.column($(this).attr("data-column"));

                column.visible(!column.visible());
                table.columns.adjust().draw();
            });

            $('#'+this._domId).find("select.selectMatchInfo").on("change",   (e) =>{
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

    populateFailedMatchInfo = () =>
    {
        this.resetFailedMatchPlayersTable();

        let matchPlayerTableHtml="";
        let columnToggleHtml="Toggle column: ";

        if (this._failedPlayers.length)
        {
            let playerAttributes=[];
            let showLatencyData=false;

            this._failedPlayers.map(player=>
            {
                console.log(player);
                let attributeHtml="";

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

            columnToggleHtml+='<a class="toggle-vis" data-column="1">Player ID</a> - ';
            columnToggleHtml+='<a class="toggle-vis" data-column="2">Ticket Status</a> - ';
            columnToggleHtml+='<a class="toggle-vis" data-column="3">Match Time</a> - ';
            let i=3;
            playerAttributes.map(playerAttributeName =>
            {
                i++;
                $('#'+this._domId).find("#failedMatchPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">' + playerAttributeName + '</a> - ';
            });

            if (showLatencyData)
            {
                i++;
                $('#'+this._domId).find("#failedMatchPlayersTable >thead tr").append("<th>Latency</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">Latency</a> - ';
            }

            $('#'+this._domId).find("#failedMatchPlayersTable >thead tr").append("<th>Ticket</th");

            columnToggleHtml = columnToggleHtml.slice(0,columnToggleHtml.length-2);

            this._failedPlayers.map(player=>
            {
                console.log(player);
                let attributeHtml="";
                playerAttributes.map(playerAttributeName =>
                {
                    console.log(playerAttributeName);
                    let playerAttribute = player.PlayerData.PlayerAttributes[playerAttributeName];
                    console.log(playerAttribute);
                    attributeHtml+= "<td>" + this.getAttributeText(playerAttribute) + "</td>";
                    //$('#'+this._domId).find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");

                });

                if (showLatencyData)
                {
                    attributeHtml+="<td>" + JSON.stringify(player.PlayerData.LatencyInMs) + "</td>";
                }

                matchPlayerTableHtml += '<tr>' +
                    '<td>' + player.ProfileName + '</td>'+
                    '<td>' + player.PlayerId + '</td>'+
                    '<td>' + player.MatchTicketStatus + '</td>'+
                    '<td>' + (player.EndMatchTime-player.StartMatchTime) + ' seconds</td>'+
                    attributeHtml +
                    '<td><a class="viewFailedMatchTicket btn btn-primary btn-sm" id="' + player.TicketId + '" href="#">View Ticket</a></td>'+
                    '</tr>'
            });

            $('#'+this._domId).find("table#failedMatchPlayersTable tbody").html(matchPlayerTableHtml);

            let table = this.activateDataTable("failedMatchPlayersTable", {
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
                }
            });

            $('#'+this._domId).find("div.unmatchedPlayers div.columnToggle").html(columnToggleHtml);
            $('#'+this._domId).find("div.unmatchedPlayers div.columnToggle a.toggle-vis").on("click", function (e)  {
                e.preventDefault();
                console.log("Toggled", e.target);
                let column = table.column($(this).attr("data-column"));

                column.visible(!column.visible());
                table.columns.adjust().draw();
            });
        }
    }

    getAttributeText = (playerAttribute) =>
    {
        if (playerAttribute==undefined)
        {
            return "-";
        }
        if (playerAttribute["S"]!=null)
        {
            return playerAttribute["S"];
        }

        if (playerAttribute["SL"].length>0)
        {
            return playerAttribute["SL"].join(", ");
        }

        if (Object.keys(playerAttribute["SDM"]).length)
        {
            let mapText="";
            Object.keys(playerAttribute["SDM"]).map(key=>
            {
                mapText+=key + ":" + playerAttribute["SDM"][key] + ", ";
            });

            mapText = mapText.slice(0,mapText.length-2);
            return mapText;
        }

        return playerAttribute["N"];

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

        console.log(html);
        this.resetRuleEvaluationMetricsTable();

        $('#'+this._domId).find("table#ruleEvaluationMetricsTable tbody").html(html);
    }

    resetSuccessfulMatchesTable()
    {
        this.resetElement(".successfulMatchesContent");
    }

    resetFailedMatchesTable()
    {
        this.resetElement(".failedMatchesContent");
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

    resetFailedMatchPlayersTable()
    {
        this.resetElement(".failedMatchPlayersContent");
    }

    resetMatchInfo()
    {
        this.resetElement(".matchInfo");
    }

    resetFailedMatchInfo()
    {
        this.resetElement(".failedMatchInfo");
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
        $('#'+this._domId).find(".matchResultsContent").show();
    }

    hideMatchResults()
    {
        $('#'+this._domId).find(".matchResultsContent").hide();
    }

    showMatchInfo()
    {
        this.resetMatchInfo();
        $('#'+this._domId).find(".matchInfo").show();
        this.hideMatchResults();
    }

    showFailedMatchInfo()
    {
        this.resetFailedMatchInfo();
        $('#'+this._domId).find(".failedMatchInfo").show();
        this.hideMatchResults();
    }

    showMatchTickets()
    {
        $('#'+this._domId).find(".matchTickets").show();
        this.hideMatchResults();
    }

    hideMatchTickets()
    {
        $('#'+this._domId).find(".matchTickets").hide();
    }

    showMatchInfoHeader()
    {
        $('#'+this._domId).find(".matchInfoHeader").show();
    }

    hideMatchInfoHeader()
    {
        $('#'+this._domId).find(".matchInfoHeader").hide();
    }

    // Hide show for match tickets list

    showSuccessfulMatchTicketsList()
    {
        this.showMatchInfoHeader();
        $('#'+this._domId).find(".successfulMatchTicketHeadersContent").show();
        this.hideMatchResults();
    }

    hideSuccessfulMatchTicketsList()
    {
        $('#'+this._domId).find(".successfulMatchTicketHeadersContent").hide();
    }

    showSuccessfulMatchTicketEventList()
    {
        this.hideMatchInfoHeader();
        $('#'+this._domId).find(".successfulMatchTicketEventsContent").show();
        this.hideMatchResults();
        this.hideSuccessfulMatchTicketsList();
    }

    hideSuccessfulMatchTicketEventList()
    {
        $('#'+this._domId).find(".successfulMatchTicketEventsContent").hide();
    }

    showFailedMatchTicketEventList()
    {
        this.hideMatchResults();
        $('#'+this._domId).find(".failedMatchTicketEventsContent").show();
    }

    hideFailedMatchTicketEventList()
    {
        $('#'+this._domId).find(".failedMatchTicketEventsContent").hide();
    }

    showSuccessfulMatchesList()
    {
        $('#'+this._domId).find(".successfulMatchesContent").show();
    }

    hideSuccessfulMatchesList()
    {
        $('#'+this._domId).find(".successfulMatchesContent").hide();
    }

    showFailedMatchesList()
    {
        $('#'+this._domId).find(".failedMatchesContent").show();
    }

    hideFailedMatchesList()
    {
        $('#'+this._domId).find(".failedMatchesContent").hide();
    }

    hideMatchInfo()
    {
        $('#'+this._domId).find(".matchInfo").hide();
    }
}