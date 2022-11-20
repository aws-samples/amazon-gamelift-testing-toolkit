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
        this.element.find("#statusText").attr("class", "alert alert-success");
        this.element.find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        this.element.find("#statusText").attr("class", "alert alert-danger");
        this.element.find("#statusText").html(text);
    }

    hideStatusAlert = () =>
    {
        this.element.find("#statusText").attr("class", "alert hide");
    }

    onTerminateVirtualPlayerResponse = (data) =>
    {
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

        this.element.find("#virtualPlayersTable_wrapper")?.remove();
        if (this.element.find("table#virtualPlayersTable").length==0)
        {
            this.element.find(".virtualPlayersContent").append(element.querySelector("#virtualPlayersTable"));
        }
    }

    onGetVirtualPlayersResponse = (data) =>
    {
        this._gameSessions = data;

        let html="";

        data.Tasks?.map(task =>
        {
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

        this.element.find("table#virtualPlayersTable tbody").append(html);
        this.activateDataTable("virtualPlayersTable");
    };


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
        if (event.target.className.indexOf("terminatePlayer") !== -1)
        {
            Network.sendObject({Type:"TerminateVirtualPlayer", TaskArn:event.target.id});
        }
        if (event.target.className.indexOf("terminateAllVirtualPlayers") !== -1)
        {
            Network.sendObject({Type:"TerminateAllVirtualPlayers"});
        }
    };
}