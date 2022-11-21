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

    resetVirtualPlayersTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#virtualPlayersTable_wrapper").remove();
        if (this.element.find("table#virtualPlayersTable").length==0)
        {
            this.element.find(".virtualPlayersContent").append(element.querySelector("#virtualPlayersTable"));
        }
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

    onLaunchVirtualPlayersResponse = (data) =>
    {
        if (data.Result)
        {
            this.showSuccessAlert(data.NumPlayers + " task(s) launched");
        }
        else
        {
            this.showFailureAlert("Error launching task(s)!");
        }
    }

    onGetTaskDefinitionsResponse = (data) =>
    {
        var optionHtml="<option value=\"\">Please select a task definition</option>";
        data.TaskDefinitions?.map(taskDefinition =>
        {
            optionHtml += "<option value=\"" + taskDefinition.TaskDefinitionArn + "\">" + taskDefinition.Family + "</option>";
        });

        this._popup.getChildByID("taskDefinition").innerHTML=optionHtml;
    };


    onPopupClick = async (event) => {

        event.stopPropagation();

        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (event.target.id == "singleLaunchRadio" || event.target.id == "singleLaunchRadioLabel") {
            this.element.find("#continuousLaunchOptions").attr("class", "hide");
        }
        else
        if (event.target.id == "continuousLaunchRadio" || event.target.id == "continuousLaunchRadioLabel") {
            this.element.find("#continuousLaunchOptions").attr("class", "");
        }
        else
        if (event.target.id == "launchPlayers")
        {
            let numPlayers = this.element.find("#numPlayers").val();
            let taskDefinitionArn = this.element.find("#taskDefinition").val();
            let fargateCapacityProvider = $("input[name='fargateCapacityProvider']:checked").val();
            if (numPlayers<1 || numPlayers>1000)
            {
                this.element.find("#errorText").attr("class", "errorText");
            }
            else
            {
                this.element.find("#errorText").attr("class", "errorText hide");
                this._emitter.emit(Events.LAUNCH_PLAYERS, {numPlayers:numPlayers, taskDefinitionArn: taskDefinitionArn, capacityProvider:fargateCapacityProvider});
            }
        }
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }
    };
}