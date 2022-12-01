// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {Events} from "../../Events/Events";
import {Network} from "../../Network/Network";

export class VirtualPlayerTasksLaunchSubPopup extends SubPopup
{
    public constructor (cacheKey:string, parentDomId:string)
    {
        super(cacheKey, parentDomId);
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetTaskDefinitions"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_TASK_DEFINITIONS_RESPONSE, this.onGetTaskDefinitionsResponse);
        this._emitter.on(Events.LAUNCH_VIRTUAL_PLAYERS_RESPONSE, this.onLaunchVirtualPlayersResponse);
        this._emitter.on(Events.LAUNCH_VIRTUAL_PLAYERS_PROGRESS_RESPONSE, this.onLaunchVirtualPlayersProgressResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_TASK_DEFINITIONS_RESPONSE, this.onGetTaskDefinitionsResponse);
        this._emitter.off(Events.LAUNCH_VIRTUAL_PLAYERS_RESPONSE, this.onLaunchVirtualPlayersResponse);
        this._emitter.off(Events.LAUNCH_VIRTUAL_PLAYERS_PROGRESS_RESPONSE, this.onLaunchVirtualPlayersProgressResponse);
    }

    setLaunchProgressText(html)
    {
        $('.launchPlayersProgressText').html(html);
    }

    onLaunchVirtualPlayersResponse = (data) =>
    {
        this.setLaunchProgressText("");
        $("button#launchPlayers").prop("disabled", false);
        if (data.Result)
        {
            this.showSuccessAlert(data.NumPlayers + " task(s) launched");
        }
        else
        {
            this.showFailureAlert("Error launching task(s)!");
        }
    }

    onLaunchVirtualPlayersProgressResponse = (data) =>
    {
        this.setLaunchProgressText(data.NumLaunched + " of " + data.TotalToLaunch + " player tasks launched");
    }

    onGetTaskDefinitionsResponse = (data) =>
    {
        var optionHtml="<option value=\"\">Please select a task definition</option>";
        data.TaskDefinitions?.map(taskDefinition =>
        {
            optionHtml += "<option value=\"" + taskDefinition.TaskDefinitionArn + "\">" + taskDefinition.Family + "</option>";
        });

        $('#'+this._parentDomId).find("#taskDefinition").html(optionHtml);
    };


    onPopupClick = async (event) => {

        event.stopPropagation();

        if (event.target.id == "singleLaunchRadio" || event.target.id == "singleLaunchRadioLabel") {
            $('#'+this._parentDomId).find("#continuousLaunchOptions").attr("class", "hide");
        }
        else
        if (event.target.id == "continuousLaunchRadio" || event.target.id == "continuousLaunchRadioLabel") {
            $('#'+this._parentDomId).find("#continuousLaunchOptions").attr("class", "");
        }
        else
        if (event.target.id == "launchPlayers")
        {
            let numPlayers = $('#'+this._parentDomId).find("#numPlayers").val();
            let taskDefinitionArn = $('#'+this._parentDomId).find("#taskDefinition").val();
            let fargateCapacityProvider = $("input[name='fargateCapacityProvider']:checked").val();
            if (numPlayers<1 || numPlayers>1000)
            {
                $('#'+this._parentDomId).find("#errorText").attr("class", "errorText");
            }
            else
            {
                $("button#launchPlayers").prop("disabled", true);
                $('#'+this._parentDomId).find("#errorText").attr("class", "errorText hide");
                this.setLaunchProgressText("Launching Virtual Player Tasks...");
                Network.sendObject({"Type":"LaunchPlayers", "NumPlayers":numPlayers, "TaskDefinitionArn":taskDefinitionArn, "CapacityProvider":fargateCapacityProvider});
            }
        }
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }
    };
}