// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSession = DataTypes.GameSession;

export class LaunchVirtualPlayersPopup extends Popup
{
    protected _gameSessions: GameSession[];
    protected _currentGameSession: GameSession;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="launchVirtualPlayersPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
        Network.sendObject({Type:"GetTaskDefinitions"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_TASK_DEFINITIONS_RESPONSE, this.onGetTaskDefinitionsResponse);
        this._emitter.on(Events.LAUNCH_VIRTUAL_PLAYERS_RESPONSE, this.onLaunchVirtualPlayersResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_TASK_DEFINITIONS_RESPONSE, this.onGetTaskDefinitionsResponse);
        this._emitter.off(Events.LAUNCH_VIRTUAL_PLAYERS_RESPONSE, this.onLaunchVirtualPlayersResponse);
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

    onLaunchVirtualPlayersResponse = (data) =>
    {
        console.log(data);
        if (data.Result)
        {
            this.showSuccessAlert(data.NumPlayers + " players launched");
        }
        else
        {
            this.showFailureAlert("Error launching players!");
        }
    }

    onGetTaskDefinitionsResponse = (data) =>
    {

        console.log(data);
        var optionHtml="<option value=\"\">Please select a task definition</option>";
        data.TaskDefinitions?.map(taskDefinition =>
        {
            optionHtml += "<option value=\"" + taskDefinition.TaskDefinitionArn + "\">" + taskDefinition.Family + "</option>";
           console.log(taskDefinition);
        });

        this._popup.getChildByID("taskDefinition").innerHTML=optionHtml;
    };


    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (event.target.id == "singleLaunchRadio" || event.target.id == "singleLaunchRadioLabel") {
            this._popup.node.querySelector("#continuousLaunchOptions").className="hide";
        }
        else
        if (event.target.id == "continuousLaunchRadio" || event.target.id == "continuousLaunchRadioLabel") {
            this._popup.node.querySelector("#continuousLaunchOptions").className="";
        }
        else
        if (event.target.id == "launchPlayers")
        {
            let numPlayers = this._popup.getChildByID("numPlayers")["value"];
            let taskDefinitionArn = this._popup.getChildByID("taskDefinition")["value"];
            console.log(numPlayers);
            console.log(taskDefinitionArn);
            if (numPlayers<1 || numPlayers>1000)
            {
                this._popup.getChildByID("errorText").className="errorText";
            }
            else
            {
                this._popup.getChildByID("errorText").className="errorText hide";
                this._emitter.emit(Events.LAUNCH_PLAYERS, {numPlayers:numPlayers, taskDefinitionArn: taskDefinitionArn});
            }
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