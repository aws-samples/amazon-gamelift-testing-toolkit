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
        console.log(gameSession);

        /*
        this._popup.getChildByID("gameSessionId").innerHTML=gameSession.GameSessionId;
        this._popup.getChildByID("ipAddress").innerHTML=gameSession.IpAddress;
        this._popup.getChildByID("dnsName").innerHTML=gameSession.DnsName;
        this._popup.getChildByID("region").innerHTML=gameSession.Location;
        this._popup.getChildByID("currentPlayerSessions").innerHTML=gameSession.CurrentPlayerSessionCount + "/" + gameSession.MaximumPlayerSessionCount;
        this._popup.getChildByID("instanceStatus").innerHTML=gameSession.Status.Value;
        this._popup.getChildByID("creationDate").innerHTML=new Date(gameSession.CreationTime).toISOString();
*/
        this._popup.node.querySelector(".gameSessionsContent").className="gameSessionsContent hide";
        this._popup.node.querySelector(".gameSessionLogsContent").className="gameSessionLogsContent hide";
        this._popup.node.querySelector(".gameSessionDetailContent").className="gameSessionDetailContent";

        console.log("SETTING UP EDITOR");
        console.log(gameSession);
        const container = document.getElementById("gameSessionJson");
        container.innerHTML="";
        const options:JSONEditorOptions = {mode:"view", name:"Game Session JSON"}

        this._editor = new JSONEditor(container, options);

        this._editor.set(gameSession);
    }

    onGetGameSessionsResponse = (data:DataTypes.GameSession[]) =>
    {
        this._gameSessions = data;

        console.log(data);
        let html="";
        this._gameSessions.map(gameSession =>
        {
            let sessionDetailLinkTd='<td><a class="viewDetail btn btn-primary btn-sm" id="' + gameSession.GameSessionId +'" href="' + "#" + '">View Detail</a></td>';
            let logLinkTd='<td><a class="viewLogs btn btn-primary btn-sm" id="' + gameSession.GameSessionId +'" href="' + "#" + '">View Logs</a></td>';
            let playerSessionsLinkTd='<td><a class="playerSessions btn btn-primary btn-sm" id="' + gameSession.GameSessionId +'" href="' + "#" + '">Player Sessions</a></td>';

            let sessionDuration = "-";

            console.log(gameSession.TerminationTime);
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
        this._popup.node.querySelector("table#gameSessionsTable tbody").insertAdjacentHTML("beforeend", html);
        this.activateDataTable("gameSessionsTable");

        if (this._currentGameSession)
        {
            this.showSessionDetail(this._currentGameSession);
        }
    };

    resetLogsTable()
    {
        this.hideStatusAlert();
        console.log(this._popup.node.querySelector("table#gameSessionLogsTable").outerHTML);
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#gameSessionLogsTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#gameSessionLogsTable")==null)
        {
            this._popup.node.querySelector(".gameSessionLogsContent")?.appendChild(element.querySelector("#gameSessionLogsTable"));
        }
    }

    resetPlayerSessionTable()
    {
        console.log(this._html);
        //const original = new DOMElement(this.scene, 0, 0).createFromCache(this._htmlName);
        console.log(this._popup.node.querySelector("table#playerSessionsTable").outerHTML);
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#playerSessionsTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#playerSessionsTable")==null)
        {
            this._popup.node.querySelector(".playerSessionsContent")?.appendChild(element.querySelector("#playerSessionsTable"));
        }
    }

    showSuccessAlert = (text) =>
    {
        this._popup.node.querySelector("#statusText").className = "alert alert-success";
        this._popup.node.querySelector("#statusText").innerHTML = text;
    }

    showFailureAlert = (text) =>
    {
        this._popup.node.querySelector("#statusText").className = "alert alert-danger";
        this._popup.node.querySelector("#statusText").innerHTML = text;
    }

    hideStatusAlert = () =>
    {
        this._popup.node.querySelector("#statusText").className = "alert hide";
    }

    onGetGameSessionLogsResponse = (logResponse) =>
    {
        this.hideStatusAlert();
        console.log(logResponse);
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

        console.log(this._logFiles);

        console.log("Trying to change to " + logKeys[logKeys.length-1]);
        this._popup.node.querySelector(".gameSessionsContent").className="gameSessionsContent hide";
        this._popup.node.querySelector(".gameSessionLogsContent").className="gameSessionLogsContent";

        sel.on("change",  (e)=>
        {
           console.log("ON CHANGE!");
           this.updateLogFile();
        });

        sel.val(logKeys[logKeys.length-1]);
        this.updateLogFile();

    };

    updateLogFile()
    {
        let selectValue = $('#gameSessionLogsFileSelect select').val() as string;
        console.log("UPDATING LOG FILE", selectValue);
//        var sel = $('#gameSessionLogsFileSelect select').val(key);
        this.resetLogsTable();
        let html="";

        this._logFiles[selectValue].map((logStr)=>
        {
            html += '<tr><td>' + logStr + '</td></tr>'
        })

        this._popup.node.querySelector("table#gameSessionLogsTable tbody").insertAdjacentHTML("beforeend", html);

        this.activateDataTable("gameSessionLogsTable", {
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            orderable:false,

        });
    }

    onGetPlayerSessionsResponse = (playerSessions) =>
    {
        //this.resetPlayerSessionTable();

        console.log(playerSessions);
        let html="";
        this._popup.node.querySelector(".gameSessionsContent").className="gameSessionsContent hide";
        this._popup.node.querySelector(".playerSessionsContent").className="playerSessionsContent";
        playerSessions.map(playerSession => {
            html += '<tr>' +
                '<td>' + playerSession.CreationTime + '</td>'+
                '<td>' + playerSession.PlayerId + '</td>'+
                '<td>' + playerSession.Status.Value + '</td>'+
                '<td>' + playerSession.GameSessionId + '</td>'+
                '<td>' + playerSession.TerminationTime + '</td></tr>'
        });

        this._popup.node.querySelector("table#playerSessionsTable tbody").insertAdjacentHTML("beforeend", html);
        this._popup.node.querySelector(".gameSessionsContent").className="gameSessionsContent hide";
        this._popup.node.querySelector(".playerSessionsContent").className="playerSessionsContent";
        this.activateDataTable("playerSessionsTable");
    };

    onPopupClick = async (event) => {
        this.hideStatusAlert();
        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (event.target.id == "backButton")
        {
            this._popup.node.querySelector(".gameSessionsContent").className="gameSessionsContent";
            this._popup.node.querySelector(".gameSessionDetailContent").className="gameSessionDetailContent hide";
            this._popup.node.querySelector(".gameSessionLogsContent").className="gameSessionLogsContent hide";
            this._popup.node.querySelector(".playerSessionsContent").className="playerSessionsContent hide";
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
            console.log(session);

            let bits = session.GameSessionId.split("/");
            let logStream = bits[1]+"/"+bits[2];
            console.log(logStream);

            Network.sendObject({Type:"GetGameSessionLogs", GameSessionId:session.GameSessionId});
        }
        else
        if (event.target.className.indexOf("playerSessions")!==-1)
        {
            let session = this._gameSessions.filter(gameSession=>gameSession.GameSessionId==event.target.id)[0];

            Network.sendObject({Type:"GetPlayerSessions", GameSessionId:session.GameSessionId});
        }
    };
/*
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
*/
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