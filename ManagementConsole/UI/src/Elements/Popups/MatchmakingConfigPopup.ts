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
import FleetData = DataTypes.FleetData;
import {Utils} from "../../Utils/Utils";
import {Locations} from "../../Data/Locations";
import SimpleResult = DataTypes.SimpleResult;
import MatchmakingConfiguration = DataTypes.MatchmakingConfiguration;

export class MatchmakingConfigPopup extends Popup
{
    protected _gameSessions: GameSession[];
    protected _currentGameSession: GameSession;
    protected _matchmakingConfig: MatchmakingConfiguration;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="matchmakingConfigPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();

        this._matchmakingConfig = data as MatchmakingConfiguration;
        console.log("GOT MM DATA");
        console.log(this._matchmakingConfig);



/*
        this._popup.getChildByID("gameSessionId").innerHTML=gameSessionData.GameSessionId;
        this._popup.getChildByID("ipAddress").innerHTML=gameSessionData.IpAddress;
        this._popup.getChildByID("dnsName").innerHTML=gameSessionData.DnsName;
        this._popup.getChildByID("region").innerHTML=gameSessionData.Location;
        this._popup.getChildByID("currentPlayerSessions").innerHTML=gameSessionData.CurrentPlayerSessionCount + "/" + gameSessionData.MaximumPlayerSessionCount;
        this._popup.getChildByID("instanceStatus").innerHTML=gameSessionData.Status.Value;
        this._popup.getChildByID("creationDate").innerHTML=new Date(gameSessionData.CreationTime).toISOString();

 */
    }

    refresh()
    {
        Network.sendObject({Type:"GetMatchmakingRuleSets"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRulesetsResponse);
        this._emitter.on(Events.UPDATE_MATCHMAKING_CONFIGURATION_RESPONSE, this.onUpdateMatchmakingConfigurationResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRulesetsResponse);
        this._emitter.off(Events.UPDATE_MATCHMAKING_CONFIGURATION_RESPONSE, this.onUpdateMatchmakingConfigurationResponse);
//        this._emitter.off(Events.GET_VIRTUAL_PLAYERS_RESPONSE, this.onGetVirtualPlayersResponse);
//        this._emitter.off(Events.TERMINATE_VIRTUAL_PLAYER_RESPONSE, this.onTerminateVirtualPlayerResponse);
    }

    onUpdateMatchmakingConfigurationResponse = (data) =>
    {
        if (data.Updated)
        {
            this.showSuccessAlert("Matchmaking Configuration updated successfully");
        }
        else
        {
            this.showFailureAlert("Error: " + data.ErrorMessage);
        }
    };

    onGetMatchmakingRulesetsResponse = (data) =>
    {

        console.log(data);
        var optionHtml="";
        data?.map(ruleSet =>
        {
            optionHtml += "<option ";
            if (ruleSet.RuleSetArn == this._matchmakingConfig.RuleSetArn)
            {
                optionHtml += "selected=\"selected\" ";
            }
            optionHtml += "value=\"" + ruleSet.RuleSetName + "\">" + ruleSet.RuleSetName + "</option>";
            console.log(ruleSet);
        });

        this._popup.getChildByID("ruleSet").innerHTML=optionHtml;
        /*
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
                '<td>' + task.LastStatus + '</td>'+
                '<td>' + task.Cpu + '</td>'+
                '<td>' + task.Memory + '</td>'+
                playerTerminateTd +
                '</tr>';
        });

        this.resetVirtualPlayersTable();

        this._popup.node.querySelector("table#virtualPlayersTable tbody").insertAdjacentHTML("beforeend", html);
        this.activateDataTable("virtualPlayersTable");

         */
    };

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

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (event.target.id == "updateConfig")
        {
            let ruleSetName = this._popup.getChildByID("ruleSet")["value"];
            console.log(ruleSetName);

            this.hideStatusAlert();
            Network.sendObject({"Type":"UpdateMatchmakingConfiguration", "RuleSetName": ruleSetName, "MatchmakingConfigName": this._matchmakingConfig.Name})

            //this._emitter.emit(Events.CLOSE_POPUP);
            //this.setVisible(false);
        }
        if (event.target.className == "refreshButton")
        {
            this.refresh();
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