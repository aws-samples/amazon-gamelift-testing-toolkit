// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSession = DataTypes.GameSession;

export class ManageVirtualPlayersPopup extends Popup
{
    protected _gameSessions: GameSession[];
    protected _currentGameSession: GameSession;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="virtualPlayersTablePopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetVirtualPlayers"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_VIRTUAL_PLAYERS_RESPONSE, this.onGetVirtualPlayersResponse);
        this._emitter.on(Events.TERMINATE_VIRTUAL_PLAYER_RESPONSE, this.onTerminateVirtualPlayerResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_VIRTUAL_PLAYERS_RESPONSE, this.onGetVirtualPlayersResponse);
        this._emitter.off(Events.TERMINATE_VIRTUAL_PLAYER_RESPONSE, this.onTerminateVirtualPlayerResponse);
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

    showSessionDetail = (gameSession) =>
    {
        console.log(gameSession);

        this._popup.getChildByID("gameSessionId").innerHTML=gameSession.GameSessionId;
        this._popup.getChildByID("ipAddress").innerHTML=gameSession.IpAddress;
        this._popup.getChildByID("dnsName").innerHTML=gameSession.DnsName;
        this._popup.getChildByID("region").innerHTML=gameSession.Location;
        this._popup.getChildByID("currentPlayerSessions").innerHTML=gameSession.CurrentPlayerSessionCount + "/" + gameSession.MaximumPlayerSessionCount;
        this._popup.getChildByID("instanceStatus").innerHTML=gameSession.Status.Value;
        this._popup.getChildByID("creationDate").innerHTML=new Date(gameSession.CreationTime).toISOString();

        this._popup.node.querySelector(".gameSessionsContent").className="gameSessionsContent hide";
        this._popup.node.querySelector(".gameSessionLogsContent").className="gameSessionLogsContent hide";
        this._popup.node.querySelector(".gameSessionDetailContent").className="gameSessionDetailContent";
    }

    onTerminateVirtualPlayerResponse = (data) =>
    {
        console.log("TERMINATE RESPONSE", data);
        if (data.Errors && data.Errors.length)
        {
            this.showFailureAlert(data.Errors[0]);
        }
        else
        {
            this.refresh();
        }
    };

    resetVirtualPlayersTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#virtualPlayersTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#virtualPlayersTable")==null)
        {
            this._popup.node.querySelector(".virtualPlayersContent")?.appendChild(element.querySelector("#virtualPlayersTable"));
        }
    }

    onGetVirtualPlayersResponse = (data) =>
    {
        this._gameSessions = data;

        console.log(data);
        let html="";

        data.Tasks?.map(task =>
        {
            console.log(task);
            let playerTerminateTd='<td><a class="terminatePlayer btn btn-primary btn-sm" id="' + task.TaskArn +'" href="' + "#" + '">Terminate Player</a></td>';

            html += '<tr>' +
                '<td>' + task.CreatedAt + '</td>'+
                '<td>' + task.TaskArn + '</td>'+
                '<td>' + task.CapacityProviderName + '</td>'+
                '<td>' + task.LastStatus + '</td>'+
                '<td>' + task.Cpu + '</td>'+
                '<td>' + task.Memory + '</td>'+
                playerTerminateTd +
                '</tr>';
        });

        this.resetVirtualPlayersTable();

        this._popup.node.querySelector("table#virtualPlayersTable tbody").insertAdjacentHTML("beforeend", html);
        this.activateDataTable("virtualPlayersTable");
    };


    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }
        if (event.target.className.indexOf("terminatePlayer") !== -1)
        {
            console.log("TRYING TO TERMINATE!");
            Network.sendObject({Type:"TerminateVirtualPlayer", TaskArn:event.target.id});
        }
        if (event.target.className.indexOf("terminateAllVirtualPlayers") !== -1)
        {
            console.log("TRYING TO TERMINATE ALL PLAYERS!");
            Network.sendObject({Type:"TerminateAllVirtualPlayers"});
        }
    };

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