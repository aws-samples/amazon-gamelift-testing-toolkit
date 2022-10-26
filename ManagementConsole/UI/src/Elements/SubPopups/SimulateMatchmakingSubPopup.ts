// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import MatchmakingRuleSet = DataTypes.MatchmakingRuleSet;
import {SubPopup} from "../Abstract/SubPopup";
import PlayerProfile = DataTypes.PlayerProfile;
import LatencyProfile = DataTypes.LatencyProfile;

export class SimulateMatchmakingSubPopup extends SubPopup
{
    protected _ticketEvents: any[];
    protected _matches: Record<string, any>;
    protected _ruleSets: MatchmakingRuleSet[];
    protected _playerProfiles: PlayerProfile[];
    protected _latencyProfiles: LatencyProfile[];
    protected _intervalId;
    protected _currentSimulation;
    protected _state="";

    public constructor (url:string, parentDomId:string)
    {
        super(url, parentDomId);
        this.getSimulationData = this.getSimulationData.bind(this);
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetMatchmakingSimulations"});
        Network.sendObject({Type:"GetMatchmakingRuleSets"});
        Network.sendObject({Type:"GetPlayerProfiles"});
        Network.sendObject({Type:"GetLatencyProfiles"});
    }

    resetElement(selector)
    {
        let el = $(this._html);
        $('#'+this._parentDomId).find(selector).html(el.find(selector).html());
    }

    resetTable()
    {
        this.resetElement(".simulateMatchmakingTableContainer");
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, this.onGetMatchmakingSimulationsResponse);
        this._emitter.on(Events.GET_SIMULATION_SUCCESSFUL_MATCHES_RESPONSE, this.onGetSimulationSuccessfulMatchesResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetSimulationSuccessfulMatchTicketsResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, this.onGetMatchmakingTicketHeadersBySimulationIdResponse);
        this._emitter.on(Events.GET_MATCHMAKING_SIMULATION_RESPONSE, this.onGetMatchmakingSimulationResponse);
        this._emitter.on(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
        this._emitter.on(Events.GET_PLAYER_PROFILES_RESPONSE, this.onGetPlayerProfilesResponse);
        this._emitter.on(Events.GET_LATENCY_PROFILES_RESPONSE, this.onGetLatencyProfilesResponse);
        this._emitter.on(Events.RUN_MATCHMAKING_SIMULATION_RESPONSE, this.onRunMatchmakingSimulationResponse);
        this._emitter.on(Events.MATCHMAKING_SIMULATION_UPDATE, this.onMatchmakingSimulationUpdate);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_MATCHMAKING_SIMULATION_RESPONSE, this.onGetMatchmakingSimulationResponse);
        this._emitter.off(Events.GET_SIMULATION_SUCCESSFUL_MATCHES_RESPONSE, this.onGetSimulationSuccessfulMatchesResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetSimulationSuccessfulMatchTicketsResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, this.onGetMatchmakingTicketHeadersBySimulationIdResponse);
        this._emitter.off(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, this.onGetMatchmakingSimulationsResponse);
        this._emitter.off(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
        this._emitter.off(Events.GET_PLAYER_PROFILES_RESPONSE, this.onGetPlayerProfilesResponse);
        this._emitter.off(Events.GET_LATENCY_PROFILES_RESPONSE, this.onGetLatencyProfilesResponse);
        this._emitter.off(Events.RUN_MATCHMAKING_SIMULATION_RESPONSE, this.onRunMatchmakingSimulationResponse);
        this._emitter.off(Events.MATCHMAKING_SIMULATION_UPDATE, this.onMatchmakingSimulationUpdate);
        this.stopPolling();
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

    populateMatchInfo = (matchId) =>
    {
        this.resetMatchInfoPlayersTable();
        let match = this._matches[matchId];
        console.log(match);

        $('#'+this._parentDomId).find("a.viewRuleEvaluationMetrics").attr("data-matchid", matchId);
        $('#'+this._parentDomId).find("a.viewSuccessfulMatchTickets").attr("data-matchid", matchId);

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


            let i=2;
            columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">Player ID</a> - ';
            playerAttributes.map(playerAttributeName =>
            {
                i++;
                $('#'+this._parentDomId).find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");
                columnToggleHtml+='<a class="toggle-vis" data-column="' + i + '">' + playerAttributeName + '</a> - ';
            });

            if (showLatencyData)
            {
                i++;
                $('#'+this._parentDomId).find("#matchInfoPlayersTable >thead tr").append("<th>Latency</th");
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
                    //$('#'+this._parentDomId).find("#matchInfoPlayersTable >thead tr").append("<th>" + playerAttributeName + "</th");

                });

                if (showLatencyData)
                {
                    attributeHtml+="<td>" + JSON.stringify(player.PlayerData.LatencyInMs) + "</td>";
                }

                matchPlayerTableHtml += '<tr>' +
                    '<td>' + player.MatchedTeam + '</td>'+
                    '<td>' + player.ProfileName + '</td>'+
                    '<td>' + player.PlayerId + '</td>'+
                    attributeHtml +
                    '</tr>'
            });

            $('#'+this._parentDomId).find("table#matchInfoPlayersTable tbody").html(matchPlayerTableHtml);



            let table = this.activateDataTable("matchInfoPlayersTable", {
                scrollY: "400px",
                scrollCollapse: true,
                dom: "Bfrtip",
                /*buttons : [
                    {
                        extend: "copyHtml5",
                        text:   '<i style="font-size:40px" class="fa fa-copy"></i>',
                        titleAttr: 'Copy'
                    },
                    {
                        extend: "csvHtml5",
                        text:      '<i style="font-size:40px" class="fa fa-file-csv"></i>',
                        titleAttr: 'CSV'
                    }
                    ],*/
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



            $('#'+this._parentDomId).find(".columnToggle").html(columnToggleHtml);
            $('#'+this._parentDomId).find("a.toggle-vis").on("click", function (e)  {
                e.preventDefault();
                console.log("Toggled", e.target);
                let column = table.column($(this).attr("data-column"));

                column.visible(!column.visible());
                table.columns.adjust().draw();
            });


            $('#'+this._parentDomId).find("select.selectMatchInfo").on("change",   (e) =>{
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
            //table.buttons().container().appendTo( '#matchInfoPlayersTable_buttons' );
        }


        /*
        let viewRuleEvaluationMetricsButton='<a class="viewRuleEvaluationMetrics btn btn-primary btn-sm" id="' + matchId +'" href="' + "#" + '">Metrics</a>';
        let viewMatchTicketsButton='<a class="viewSuccessfulMatchTickets btn btn-primary btn-sm" id="' + matchId +'" href="' + "#" + '">Tickets</a>';

        let html = viewRuleEvaluationMetricsButton + viewMatchTicketsButton;

        $('#'+this._parentDomId).find("#matchInfoContent").html(html);

         */
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

        metrics.map(matchResult => {
            this._matches[matchResult.MatchId] = matchResult;
            html += '<tr>' +
                '<td>' + matchResult.ruleName + '</td>'+
                '<td>' + matchResult.passedCount + '</td>'+
                '<td>' + matchResult.failedCount + '</td>'+
                '</tr>'
        });

        console.log(html);
        this.resetRuleEvaluationMetricsTable();

        $('#'+this._parentDomId).find("table#ruleEvaluationMetricsTable tbody").html(html);


    }

    onGetSimulationSuccessfulMatchesResponse = (matchResults) =>
    {
        console.log("GOT SIMULATION MATCHES RESPONSE", matchResults);
        let html="";
        this._matches = {};

        matchResults.map(matchResult => {
            this._matches[matchResult.MatchId] = matchResult;
            let matchPlayerText="";
            let matchPlayers={};
            matchResult.Players.map(player =>
            {
                if (matchPlayers[player.MatchedTeam]==undefined)
                {
                    matchPlayers[player.MatchedTeam]={};
                }
                if (matchPlayers[player.MatchedTeam][player["ProfileName"]]==undefined)
                {
                    matchPlayers[player.MatchedTeam][player["ProfileName"]]=0;
                }
                matchPlayers[player.MatchedTeam][player["ProfileName"]]++;
            });

            Object.keys(matchPlayers).map(matchedTeam=>
            {
                matchPlayerText += matchedTeam +" - ";
                Object.keys(matchPlayers[matchedTeam]).map(matchedProfile=>
                {
                    matchPlayerText+= matchPlayers[matchedTeam][matchedProfile] + " " + matchedProfile + ", ";
                });
                matchPlayerText = matchPlayerText.slice(0,matchPlayerText.length-2);
                matchPlayerText+="<br/>";
            });
            console.log(matchPlayers);
            let viewMatchInfoTd='<td><a class="viewMatchInfo btn btn-primary btn-sm" id="' + matchResult.MatchId +'" href="' + "#" + '">Match Info</a></td>';
            let viewRuleEvaluationMetricsTd='<td><a class="viewRuleEvaluationMetrics btn btn-primary btn-sm" id="' + matchResult.MatchId +'" href="' + "#" + '">Metrics</a></td>';
            let viewMatchTicketsTd='<td><a class="viewSuccessfulMatchTickets btn btn-primary btn-sm" id="' + matchResult.MatchId +'" href="' + "#" + '">Tickets</a></td>';
            html += '<tr>' +
                '<td>' + matchResult.Date + '</td>'+
                '<td>' + matchResult.MatchId + '</td>'+
                '<td>' + matchPlayerText + '</td>'+
                viewMatchInfoTd +
                //viewRuleEvaluationMetricsTd +
                //viewMatchTicketsTd +
                '</tr>'
        });

        console.log(html);
        this.resetSuccessfulMatchesTable();
        this.resetSuccessfulMatchTicketEventTable();

        $('#'+this._parentDomId).find("table#successfulMatchesTable tbody").html(html);

        this.hideMatchmakingTicketsList();
        this.showSuccessfulMatchesList();
        /*this.activateDataTable("successfulMatchesTable", {
            scrollY: "400px",
            scrollCollapse: true,
            //ordering:false,
            columns: [
                { orderable:false },
                { orderable:false },
                { orderable:false },
                { orderable:false },
                { orderable:false },
                { orderable:false },
            ],
            order: [[ 0, "desc" ]]
        });*/
        this.activateDataTable("successfulMatchesTable");

    }

    onGetSimulationSuccessfulMatchTicketsResponse = (data) =>
    {
        console.log("GOT SUCCESSFUL MATCH TICKETS RESPONSE", data);
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


        console.log(html);
        this.resetSuccessfulMatchTicketsTable();

        $('#'+this._parentDomId).find("table#successfulMatchTicketHeadersTable tbody").html(html);

        /*
        this.hideMatchmakingTicketsList();
        this.hideSuccessfulMatchesList();
        this.hideMatchInfo();
        this.showSuccessfulMatchTicketsList();
         */


    }

    onGetMatchmakingSimulationResponse = (simulation) =>
    {
        this.updateSimulationStats(simulation);
    }

    onRunMatchmakingSimulationResponse = (simulation) =>
    {
        this._currentSimulation = simulation;
        this.showSimulationOutput();
        this.updateSimulationStats(simulation);
        this.startPolling();
    }

    getSimulationData()
    {
        Network.sendObject({Type:"GetMatchmakingSimulation", SimulationId:this._currentSimulation.SimulationId});
    }

    onMatchmakingSimulationUpdate = (simulation) =>
    {
        console.log(simulation);
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
            $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation Complete");
            $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("inProgressBg").addClass("completeBg");
            this.stopPolling();
            $('#'+this._parentDomId).find("#showSimulationMatches").show();
            $('#'+this._parentDomId).find("#showSimulationTickets").show();
        }
        else
        {
            $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingStatus").html("Simulation In Progress");
            $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingStatus").removeClass("completeBg").addClass("inProgressBg");
        }

        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.simulationDate").html(simulation.Date);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.totalPlayers").html(totalPlayers.toString());
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.totalEvents").html(totalEvents.toString());
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.totalMatchAttempts").html(totalMatchAttempts.toString());
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.playersMatched").html(simulation.PlayersMatched + '/' + totalPlayers);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.playersMatchFailed").html(simulation.PlayersFailed + '/' + totalPlayers);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchesMade").html(simulation.MatchesMade + '/' + totalMatchAttempts);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingSearchingEvents").html(simulation.MatchmakingSearchingEvents);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.potentialMatchCreatedEvents").html(simulation.PotentialMatchCreatedEvents);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingSucceededEvents").html(simulation.MatchmakingSucceededEvents);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingTimedOutEvents").html(simulation.MatchmakingTimedOutEvents);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingCancelledEvents").html(simulation.MatchmakingCancelledEvents);
        $('#'+this._parentDomId).find(".simulateMatchmakingOutput span.matchmakingFailedEvents").html(simulation.MatchmakingFailedEvents);
    }

    onGetMatchmakingSimulationsResponse = (data) =>
    {
        console.log("GOT MATCHMAKING SIMULATIONS RESPONSE!");
        let html="";
        data.map(simulation =>
        {
            console.log(simulation);

            let viewResultsTd='<td><a class="viewSimulationOutput btn btn-primary btn-sm" id="' + simulation.SimulationId +'" href="' + "#" + '">View Results</a></td>';

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
        $('#'+this._parentDomId).find("table#matchmakingSimulationsTable tbody").append( html);
        this.activateDataTable("matchmakingSimulationsTable");
    }

    onGetMatchmakingRuleSetsResponse = (data) => {
        console.log("GOT RULESETS RESPONSE!");
        this._ruleSets = data;
        $('#'+this._parentDomId).find("#simulationRuleSet").html("");
        this._ruleSets.map(ruleset=>
        {
            $('#'+this._parentDomId).find("#simulationRuleSet").append('<option value="' + ruleset.RuleSetArn + '">' + ruleset.RuleSetName + '</option>');
        })
    }

    onGetPlayerProfilesResponse = (data) =>
    {
        this._playerProfiles = data;
    }

    onGetLatencyProfilesResponse = (data) =>
    {
        this._latencyProfiles = data;
    }

    onGetMatchmakingTicketHeadersBySimulationIdResponse = (data) =>
    {
        let html="";

        this.showMatchmakingTicketsList();
        this.hideSimulationOutput();

        let matchData = {successfulMatches:{}, failedMatches:[]};

        data.TicketHeaders?.map(header =>
        {
            let viewEventsTd='<td><a class="viewTicket btn btn-primary btn-sm" id="' + header.TicketId +'" href="' + "#" + '">View Events</a></td>';
            let viewQueueEventsTd='<td><a class="viewQueueEvent btn btn-primary btn-sm" id="' + header.MatchId +'" href="' + "#" + '">View Queue Event</a></td>';

            if (header.MatchId==undefined)
            {
                viewQueueEventsTd='<td></td>';
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

        console.log(matchData);

        this.resetTicketHeadersTable();

        $('#'+this._parentDomId).find("table#matchmakingTicketHeadersTable tbody").html(html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    onGetMatchmakingTicketResponse = (ticket) =>
    {
        console.log(ticket);
        let html="";

        this._ticketEvents = ticket.Ticket.Events;

        if (this._state=="viewTicket")
        {
            this._ticketEvents.map(ticketEvent => {
                let viewEventDetailTd='<td><a class="viewTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id +'" href="' + "#" + '">View Detail</a></td>';
                html += '<tr>' +
                    '<td>' + ticketEvent.time + '</td>'+
                    '<td>' + ticketEvent.detail.type + '</td>'+
                    viewEventDetailTd +
                    '</tr>'
            });

            console.log(html);
            this.resetEventsTable();

            $('#'+this._parentDomId).find("table#matchmakingTicketEventsTable tbody").html(html);

            this.hideMatchmakingTicketsList();
            this.showMatchmakingTicketEventList();
            this.activateDataTable("matchmakingTicketEventsTable");
        }
        else if (this._state=="viewSuccessfulMatchTicket")
        {
            this._ticketEvents.map(ticketEvent => {
                let viewEventDetailTd='<td><a class="viewSuccessfulMatchTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id +'" href="' + "#" + '">View Detail</a></td>';
                html += '<tr>' +
                    '<td>' + ticketEvent.time + '</td>'+
                    '<td>' + ticketEvent.detail.type + '</td>'+
                    viewEventDetailTd +
                    '</tr>'
            });

            $('#'+this._parentDomId).find("table#successfulMatchmakingTicketEventsTable tbody").html(html);
            this.hideSuccessfulMatchTicketsList();
            this.showSuccessfulMatchTicketEventList();
            this.activateDataTable("successfulMatchmakingTicketEventsTable");
        }

    };

    showMatchmakingTicketsList()
    {
        $('#'+this._parentDomId).find(".matchmakingTicketHeadersContent").show();
        this.hideSimulationOutput();
    }

    showSuccessfulMatchesList()
    {
        $('#'+this._parentDomId).find(".successfulMatchesContent").show();
        this.hideSimulationOutput();
    }

    showMatchInfo()
    {
        this.resetMatchInfo();
        $('#'+this._parentDomId).find(".matchInfo").show();
        this.hideSuccessfulMatchesList();
    }

    showMatchmakingTicketEventList()
    {
        $('#'+this._parentDomId).find(".matchmakingTicketEventsContent").show();
        this.hideSimulationOutput();
    }

    hideMatchmakingTicketEventList()
    {
        $('#'+this._parentDomId).find(".matchmakingTicketEventsContent").hide();
    }



    hideMatchmakingTicketsList()
    {
        $('#'+this._parentDomId).find(".matchmakingTicketHeadersContent").hide();
    }

    hideSuccessfulMatchesList()
    {
        $('#'+this._parentDomId).find(".successfulMatchesContent").hide();
    }

    hideMatchInfo()
    {
        $('#'+this._parentDomId).find(".matchInfo").hide();
    }

    hideRuleEvaluationMetricsList()
    {
        $('#'+this._parentDomId).find(".ruleEvaluationMetricsContent").hide();
    }



    resetTicketHeadersTable()
    {
        this.resetElement(".matchmakingTicketHeadersContent");
    }

    resetMatchInfoPlayersTable()
    {
        this.resetElement(".matchInfoPlayersContent");
    }

    resetMatchInfo()
    {
        this.resetElement(".matchInfo");
    }

    resetEventsTable()
    {
        this.resetElement(".matchmakingTicketEventsContent");
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

    addPlayerProfile = () =>
    {
        this.hideStatusAlert();
        $.get('assets/html/fragments/playerProfileTemplate.html', (data) => {
            let template = $(data);
            this._playerProfiles.map(profile => {
                template.find("select#playerProfile").append('<option value="' + profile.ProfileId + '">' + profile.Name + '</option>');
                console.log(data);
            });
            this._latencyProfiles.map(profile => {
                template.find("select#latencyProfile").append('<option value="' + profile.ProfileId + '">' + profile.Name + '</option>');
                console.log(data);
            });
            template.appendTo($('#'+this._parentDomId).find("#simulationPlayerProfiles"));
        });
    }

    runSimulation = () =>
    {
        let playerProfileConfigs=[];
        let totalPlayersAdded=0;

        $('#'+this._parentDomId).find(".playerProfileTemplate").each(function ()
        {
           console.log($(this));
           playerProfileConfigs.push({
               ProfileId: $(this).find('#playerProfile').val(),
               NumPlayers: parseInt($(this).find('.numPlayers').val() as string),
               LatencyProfileId: $(this).find('#latencyProfile').val(),
           });

           totalPlayersAdded += parseInt($(this).find('.numPlayers').val() as string);
        });

        console.log(playerProfileConfigs);

        if (totalPlayersAdded==0 || totalPlayersAdded>1000)
        {
            this.showFailureAlert("You need to simulate between 0-1000 profiles");
        }
        else
        {
            Network.sendObject({Type:"RunMatchmakingSimulation", RuleSet: $('#simulationRuleSet').val(), PlayerProfileConfigs: playerProfileConfigs});
        }
    }

    showSimulationOutput()
    {
        $('#'+this._parentDomId).find('.simulateMatchmakingForm').hide();
        $('#'+this._parentDomId).find('.simulateMatchmakingTableContainer').hide();
        $('#'+this._parentDomId).find('.simulateMatchmakingOutput').show();
    }

    hideSimulationOutput()
    {
        $('#'+this._parentDomId).find('.simulateMatchmakingOutput').hide();
    }

    hideSimulationsList()
    {
        $('#'+this._parentDomId).find('.simulateMatchmakingTableContainer').hide();
    }


    showSuccessAlert = (text) =>
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert alert-success";
        $('#'+this._parentDomId).find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert alert-danger";
        $('#'+this._parentDomId).find("#statusText").html(text);
    }

    hideStatusAlert = () =>
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert hide";
    }

    showMatchmakingTicketJson()
    {
        $('#'+this._parentDomId).find(".matchmakingTicketEventDetailContent").show();
    }

    hideMatchmakingTicketJson()
    {
        $('#'+this._parentDomId).find(".matchmakingTicketEventDetailContent").hide();
    }

    showSuccessfulMatchTicketJson()
    {
        $('#'+this._parentDomId).find(".successfulMatchTicketEventDetailContent").show();
    }

    hideSuccessfulMatchTicketJson()
    {
        $('#'+this._parentDomId).find(".successfulMatchTicketEventDetailContent").hide();
    }


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
    }

    showSuccessfulMatchTicketEventDetail = (ticketEvent) =>
    {
        console.log(ticketEvent);

        const container = document.getElementById("successfulMatchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideSuccessfulMatchTicketEventList();
        this.showSuccessfulMatchTicketJson();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        console.log(el);

        if (event.target.className.indexOf("viewTicketEvent") !== -1)
        {
            console.log("VIEWING TICKET DETAIL!");
            console.log(event.target.id);
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showEventDetail(ticketEvent);
        }
        else
        if (event.target.className.indexOf("viewSuccessfulMatchTicketEvent") !== -1)
        {
            console.log("VIEWING SUCCESSFUL MATCH TICKET DETAIL!");
            console.log(event.target.id);
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showSuccessfulMatchTicketEventDetail(ticketEvent);
        }
        else
        if (event.target.id=="eventDetailBackButton") // back to event list
        {
            this.backToMatchmakingTicketEventList();
        }
        else
        if (event.target.id=="successfulMatchTicketEventDetailBackButton") // back to event list
        {
            this.backToSuccessfulMatchTicketEventList();
        }
        else
        if (event.target.id=="simulateMatchmakingButton") // show simulation formn
        {
            $('.simulateMatchmakingForm').show();
            $('.simulateMatchmakingTableContainer').hide();
        }
        else if (event.target.id=="runSimulation") // actually run simulation
        {
            this.runSimulation();
        }
        else if (event.target.id=="backToMatchmakingSimulations") // back to simulations table
        {
            this.stopPolling();
            this.hideStatusAlert();
            this.refresh();
            $('.simulateMatchmakingForm').hide();
            $('.simulateMatchmakingTableContainer').show();
            this.hideSimulationOutput();
        }
        else if (el.hasClass("viewSimulationOutput"))
        {
            this._currentSimulation = {SimulationId: el.attr("id")};
            this.resetElement(".simulateMatchmakingOutput");
            this.showSimulationOutput();
            this.startPolling();
        }
        else if (event.target.id=="addPlayerProfile")
        {
            this.addPlayerProfile();
        }
        else if (el.hasClass("removeProfile"))
        {
            el.parent().parent().parent().remove();
        }
        else if (el.hasClass("viewTicket"))
        {
            this._state = "viewTicket";
            console.log("VIEWING TICKET!");
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
        else if (el.hasClass("viewSuccessfulMatchTickets"))
        {
            Network.sendObject({Type:"GetMatchmakingTicketHeadersByMatchId", MatchId:event.target.dataset.matchid});
        }
        else if (el.hasClass("viewSuccessfulMatchTicket"))
        {
            this._state = "viewSuccessfulMatchTicket";

            console.log("View successful match ticket", event.target.id);
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});

        }
        else if (el.hasClass("viewMatchInfo"))
        {
            this.hideSuccessfulMatchesList();
            this.showMatchInfo();
            this.populateMatchInfo(event.target.id);
            Network.sendObject({Type:"GetMatchmakingTicketHeadersByMatchId", MatchId:event.target.id});
        }
        else if (event.target.id=="showSimulationMatches")
        {
            console.log("SHOW SIMULATION MATCHES:" + this._currentSimulation.SimulationId);
            Network.sendObject({Type:"GetSimulationMatches", SimulationId:this._currentSimulation.SimulationId});
        }
        else if (event.target.id=="showSimulationTickets")
        {
            console.log("SHOW SIMULATION TICKETS:" + this._currentSimulation.SimulationId);
            Network.sendObject({Type:"GetMatchmakingTicketHeadersBySimulationId", SimulationId:this._currentSimulation.SimulationId});
        }
        else if (event.target.id=="backToSimulationOutput")
        {
            this.showSimulationOutput();
            this.hideMatchmakingTicketsList();
            this.hideSuccessfulMatchesList();
        }
        else if (event.target.id=="backToMatchInfo")
        {
            this.hideSuccessfulMatchesList();
            this.showMatchInfo();
            //this.hideRuleEvaluationMetricsList();
            this.hideSuccessfulMatchTicketsList();
        }
        else if (event.target.id=="backToSuccessfulMatches")
        {
            this.showSuccessfulMatchesList();
            //this.hideRuleEvaluationMetricsList();
            this.hideMatchInfo();
            this.hideSuccessfulMatchTicketsList();
        }
        else if (event.target.id=="backToSuccessfulMatchTickets")
        {
            this.resetSuccessfulMatchTicketEventTable();
            this.showSuccessfulMatchTicketsList();
            this.hideSuccessfulMatchTicketEventList();
        }
        else
        if (event.target.id == "backButton")
        {
            this.backToMatchmakingTicketsList();
        }
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

    showMatchTickets()
    {
        $('#'+this._parentDomId).find(".matchTickets").show();
        this.hideSuccessfulMatchesList();
    }

    hideMatchTickets()
    {
        $('#'+this._parentDomId).find(".matchTickets").hide();
    }

    showMatchInfoHeader()
    {
        $('#'+this._parentDomId).find(".matchInfoHeader").show();
    }

    hideMatchInfoHeader()
    {
        $('#'+this._parentDomId).find(".matchInfoHeader").hide();
    }

    // Hide show for match tickets list

    showSuccessfulMatchTicketsList()
    {
        this.showMatchInfoHeader();
        $('#'+this._parentDomId).find(".successfulMatchTicketHeadersContent").show();
        this.hideSuccessfulMatchesList();
    }

    hideSuccessfulMatchTicketsList()
    {
        $('#'+this._parentDomId).find(".successfulMatchTicketHeadersContent").hide();
    }

    showSuccessfulMatchTicketEventList()
    {
        this.hideMatchInfoHeader();
        $('#'+this._parentDomId).find(".successfulMatchTicketEventsContent").show();
        this.hideSuccessfulMatchesList();
        this.hideSuccessfulMatchTicketsList();
    }

    hideSuccessfulMatchTicketEventList()
    {
        $('#'+this._parentDomId).find(".successfulMatchTicketEventsContent").hide();
    }

    //

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

    backToSuccessfulMatchTicketEventList()
    {
        this.showSuccessfulMatchTicketEventList();
        this.hideSuccessfulMatchTicketJson();
        this.resetSuccessfulMatchJson();
    }

    resetJson()
    {
        $('#'+this._parentDomId).find("#matchmakingTicketEventJson").html("");
    }

    resetSuccessfulMatchJson()
    {
        $('#'+this._parentDomId).find("#successfulMatchmakingTicketEventJson").html("");
    }

    activateDataTable(id, config=null) {
        // @ts-ignore
        if ( ! $.fn.DataTable.isDataTable( '#'+id ) )
        {
            if (config==null)
            {
                config = {
                    scrollY: "400px",
                    scrollCollapse: true,
                    columnDefs: [
                        { width: 200, targets: 0 }
                    ],
                    order: [[ 0, "desc" ]],

                };
            }
            // @ts-ignore
            var table = $('#'+this._parentDomId).find("#"+id).DataTable(config);
            return table;
        }
    }
}