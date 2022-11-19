// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSession = DataTypes.GameSession;
import {Utils} from "../../Utils/Utils";
import JSONEditor, {JSONEditorOptions} from "jsoneditor";

export class GameSessionsTablePopup extends Popup
{
    protected _gameSessions: GameSession[];
    protected _currentGameSession: GameSession;
    protected _editor;
    protected _logFiles: Record<string, string[]>;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="gameSessionsTablePopup";
        this.setupEventListeners();
        this._logFiles={};
    }

    setPopupData(data:any)
    {
        let fleetId = data.FleetId;
        if (data.GameSession)
        {
            this._currentGameSession = data.GameSession;
        }

        Network.sendObject({Type:"GetGameSessions", FleetId:fleetId});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_GAME_SESSIONS_RESPONSE, this.onGetGameSessionsResponse);
        this._emitter.on(Events.GET_GAME_SESSION_LOGS_RESPONSE, this.onGetGameSessionLogsResponse);
        this._emitter.on(Events.GET_PLAYER_SESSIONS_RESPONSE, this.onGetPlayerSessionsResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_GAME_SESSIONS_RESPONSE, this.onGetGameSessionsResponse);
        this._emitter.off(Events.GET_GAME_SESSION_LOGS_RESPONSE, this.onGetGameSessionLogsResponse);
        this._emitter.off(Events.GET_PLAYER_SESSIONS_RESPONSE, this.onGetPlayerSessionsResponse);
    }

    showSessionDetail = (gameSession) =>
    {
        this.element.find(".gameSessionsContent").attr("class","gameSessionsContent hide");
        this.element.find(".gameSessionLogsContent").attr("class","gameSessionLogsContent hide");
        this.element.find(".gameSessionDetailContent").attr("class","gameSessionDetailContent");

        const container = this.element.find("#gameSessionJson")[0];
        container.innerHTML="";
        const options:JSONEditorOptions = {mode:"view", name:"Game Session JSON"}
        this._editor = new JSONEditor(container, options);
        this._editor.set(gameSession);
    }

    onGetGameSessionsResponse = (data:DataTypes.GameSession[]) =>
    {
        this._gameSessions = data;
        let html="";
        this._gameSessions.map(gameSession =>
        {
            let sessionDetailLinkTd='<td><a class="viewDetail btn btn-primary btn-sm" id="' + gameSession.GameSessionId +'" href="' + "#" + '">View Detail</a></td>';
            let logLinkTd='<td><a class="viewLogs btn btn-primary btn-sm" id="' + gameSession.GameSessionId +'" href="' + "#" + '">View Logs</a></td>';
            let playerSessionsLinkTd='<td><a class="playerSessions btn btn-primary btn-sm" id="' + gameSession.GameSessionId +'" href="' + "#" + '">Player Sessions</a></td>';

            let sessionDuration = "-";
            
            if (gameSession.TerminationTime[0]!="0")
            {
                let creationDate = new Date(gameSession.CreationTime);
                let terminationDate = new Date(gameSession.TerminationTime);
                let secondsDuration = Math.round((terminationDate.getTime() - creationDate.getTime())/1000);
                sessionDuration = Utils.secondsToDuration(secondsDuration);
            }

            let status = gameSession.Status.Value;
            if (gameSession.StatusReason!=null)
            {
                status = "INTERRUPTED";
            }

            html += '<tr>' +
                '<td>' + gameSession.CreationTime + '</td>'+
                '<td>' + sessionDuration + '</td>'+
                '<td>' + status + '</td>' +
                '<td>' + gameSession.IpAddress + '</td>' +
                sessionDetailLinkTd +
                playerSessionsLinkTd +
                logLinkTd +
                '</tr>';
        })
        this.element.find("table#gameSessionsTable tbody").append(html);
        this.activateDataTable("gameSessionsTable");

        if (this._currentGameSession)
        {
            this.showSessionDetail(this._currentGameSession);
        }
    };

    resetLogsTable()
    {
        this.hideStatusAlert();
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#gameSessionLogsTable_wrapper").remove();
        if (this.element.find("table#gameSessionLogsTable").length==0)
        {
            this.element.find(".gameSessionLogsContent").append(element.querySelector("#gameSessionLogsTable"));
        }
    }

    resetPlayerSessionTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#playerSessionsTable_wrapper").remove();
        if (this.element.find("table#playerSessionsTable").length==0)
        {
            this.element.find(".playerSessionsContent").append(element.querySelector("#playerSessionsTable"));
        }
    }

    showSuccessAlert = (text) =>
    {
        this.element.find("#statusText").attr("class","alert alert-success");
        this.element.find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        this.element.find("#statusText").attr("class","alert alert-danger");
        this.element.find("#statusText").html(text);
    }

    hideStatusAlert = () =>
    {
        this.element.find("#statusText").attr("class","alert hide");
    }

    onGetGameSessionLogsResponse = (logResponse) =>
    {
        this.hideStatusAlert();
        if (logResponse==null)
        {
            this.showFailureAlert("Couldn't get server response");
            return;
        }
        if (logResponse.ErrorMessage!=null)
        {
            this.showFailureAlert(logResponse.ErrorMessage);
            return;
        }
        let html="";

        this._logFiles={};

        let logKeys = Object.keys(logResponse.LogFiles);

        $('#gameSessionLogsFileSelect').html('');
        var sel = $('<select>').appendTo('#gameSessionLogsFileSelect');
        logKeys.map(logFile => {
            this._logFiles[logFile] = logResponse.LogFiles[logFile];
            sel.append($("<option>").attr('value',logFile).text(logFile));
        });

        this.element.find(".gameSessionsContent").attr("class","gameSessionsContent hide");
        this.element.find(".gameSessionLogsContent").attr("class","gameSessionLogsContent");

        sel.on("change",  (e)=>
        {
           this.updateLogFile();
        });

        sel.val(logKeys[logKeys.length-1]);
        this.updateLogFile();

    };

    updateLogFile()
    {
        let selectValue = $('#gameSessionLogsFileSelect select').val() as string;
        this.resetLogsTable();
        let html="";

        this._logFiles[selectValue].map((logStr)=>
        {
            html += '<tr><td>' + logStr + '</td></tr>'
        })

        this.element.find("table#gameSessionLogsTable tbody").append(html);

        this.activateDataTable("gameSessionLogsTable", {
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            ordering:false,

        });
    }

    onGetPlayerSessionsResponse = (playerSessions) =>
    {
        //this.resetPlayerSessionTable();
        let html="";
        this.element.find(".gameSessionsContent").attr("class","gameSessionsContent hide");
        this.element.find(".playerSessionsContent").attr("class","playerSessionsContent");
        playerSessions.map(playerSession => {
            html += '<tr>' +
                '<td>' + playerSession.CreationTime + '</td>'+
                '<td>' + playerSession.PlayerId + '</td>'+
                '<td>' + playerSession.Status.Value + '</td>'+
                '<td>' + playerSession.GameSessionId + '</td>'+
                '<td>' + playerSession.TerminationTime + '</td></tr>'
        });

        this.element.find("table#playerSessionsTable tbody").append(html);
        this.element.find(".gameSessionsContent").attr("class","gameSessionsContent hide");
        this.element.find(".playerSessionsContent").attr("class","playerSessionsContent");
        this.activateDataTable("playerSessionsTable");
    };

    onPopupClick = async (event) => {
        this.hideStatusAlert();
        event.stopPropagation();
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (event.target.id == "backButton")
        {
            this.element.find(".gameSessionsContent").attr("class","gameSessionsContent");
            this.element.find(".gameSessionDetailContent").attr("class","gameSessionDetailContent hide");
            this.element.find(".gameSessionLogsContent").attr("class","gameSessionLogsContent hide");
            this.element.find(".playerSessionsContent").attr("class","playerSessionsContent hide");
            this.resetLogsTable();
            this.resetPlayerSessionTable();
        }
        else
        if (event.target.className.indexOf("viewDetail")!==-1)
        {
            let session = this._gameSessions.filter(gameSession=>gameSession.GameSessionId==event.target.id)[0];
            this.showSessionDetail(session);
        }
        else
        if (event.target.className.indexOf("viewLogs")!==-1)
        {
            let session = this._gameSessions.filter(gameSession=>gameSession.GameSessionId==event.target.id)[0];
            Network.sendObject({Type:"GetGameSessionLogs", GameSessionId:session.GameSessionId});
        }
        else
        if (event.target.className.indexOf("playerSessions")!==-1)
        {
            let session = this._gameSessions.filter(gameSession=>gameSession.GameSessionId==event.target.id)[0];

            Network.sendObject({Type:"GetPlayerSessions", GameSessionId:session.GameSessionId});
        }
    };

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
            var table = $("#"+id).DataTable(config);
            return table;
        }
    }
}