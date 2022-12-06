// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {DataTypes} from "../../Data/DataTypes";
import VirtualPlayerTaskSchedule = DataTypes.VirtualPlayerTaskSchedule;
import {SubPopups} from "../SubPopups/SubPopups";

export class VirtualPlayerTasksLaunchPage extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_TASKS_LAUNCH;
    public static cacheKey = this.id;
    protected _schedules:VirtualPlayerTaskSchedule[] = [];

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerTasksLaunchPage.cacheKey, parentPage, VirtualPlayerTasksLaunchPage.id);
    }

    refresh = ()=>
    {
        this.hideStatusAlert();

        $('input[type=radio][name=launchType]').on("change", this.onLaunchTypeChange);
        $('select#scheduleId').on("change", this.validateForm);
        $('select#taskDefinition').on("change", this.validateForm);
        $('input#numPlayers').on("change", this.validateForm);

        Network.sendObject({Type:"GetTaskDefinitions"});
    }

    initPage() {
        this.refresh();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_TASK_DEFINITIONS_RESPONSE, this.onGetTaskDefinitionsResponse);
        this._emitter.on(Events.LAUNCH_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onLaunchVirtualPlayersResponse);
        this._emitter.on(Events.LAUNCH_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onLaunchVirtualPlayerTaskScheduleResponse);
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, this.onGetVirtualPlayerTaskSchedulesResponse);
        this._emitter.on(Events.GET_SCHEDULER_SCHEDULES_RESPONSE, this.onGetSchedulerSchedulesResponse);
        this._emitter.on(Events.LAUNCH_VIRTUAL_PLAYER_TASKS_PROGRESS_RESPONSE, this.onLaunchVirtualPlayersProgressResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_TASK_DEFINITIONS_RESPONSE, this.onGetTaskDefinitionsResponse);
        this._emitter.off(Events.LAUNCH_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onLaunchVirtualPlayersResponse);
        this._emitter.off(Events.LAUNCH_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onLaunchVirtualPlayerTaskScheduleResponse);
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, this.onGetVirtualPlayerTaskSchedulesResponse);
        this._emitter.off(Events.GET_SCHEDULER_SCHEDULES_RESPONSE, this.onGetSchedulerSchedulesResponse);
        this._emitter.off(Events.LAUNCH_VIRTUAL_PLAYER_TASKS_PROGRESS_RESPONSE, this.onLaunchVirtualPlayersProgressResponse);
    }

    setLaunchProgressText(html)
    {
        $('.launchPlayersProgressText').html(html);
    }

    getScheduleType = () =>
    {
        return $('input[type=radio][name=launchType]:checked').val();
    }

    onLaunchTypeChange = (e) =>
    {
        const launchType = this.getScheduleType();

        $('#' + this._domId).find(".noSchedules").hide();

        $("button#launchPlayers").show();

        if (launchType=="taskLaunch")
        {
            $("#" + this._domId).find(".taskLaunchForm").show();
            $("#" + this._domId).find(".scheduleLaunchForm").hide();
        }
        else
        if (launchType=="scheduleLaunch")
        {
            Network.sendObject({Type:"GetSchedulerSchedules"});
        }

        this.validateForm();
    }


    onGetSchedulerSchedulesResponse = (data) =>
    {
        if (data.Schedules.LaunchSchedule.State.Value=="DISABLED" && data.Schedules.TerminateSchedule.State.Value=="DISABLED")
        {
            $("#" + this._domId).find(".taskLaunchForm").hide();
            $("#" + this._domId).find(".scheduleLaunchForm").show();
            if (this._schedules.length==0)
            {
                $("button#launchPlayers").hide();
                $('#'+this._domId).find(".scheduleLaunchForm").hide();
                $('#'+this._domId).find(".noSchedules").show();
            }
        }
        else
        {
            $("button#launchPlayers").hide();
            $("#" + this._domId).find(".taskLaunchForm").hide();
            $('#'+this._domId).find(".scheduleLaunchForm").hide();
            $('#'+this._domId).find(".existingSchedule").show();
        }

        this.validateForm();
    };

    validateForm = () =>
    {
        let errors=[];
        let errorsFound=0;

        const launchType = this.getScheduleType();

        let scheduleId = $('#'+this._domId).find("#scheduleId").val();
        let numPlayers = $('#'+this._domId).find("#numPlayers").val();
        let taskDefinitionArn = $('#'+this._domId).find("#taskDefinition").val();
        let fargateCapacityProvider = $("input[name='fargateCapacityProvider']:checked").val();

        if (taskDefinitionArn=="")
        {
            errorsFound++;
            errors.push("You must specify a task to launch");
        }

        if (launchType=="taskLaunch")
        {
            if (numPlayers<1 || numPlayers>500)
            {
                errorsFound++;
                errors.push("You must enter between 1-500 players");
            }
        }
        else
        if (launchType=="scheduleLaunch")
        {
            if (scheduleId=="" || scheduleId==undefined)
            {
                errorsFound++;
                errors.push("You must select a schedule");
            }
        }

        if (errorsFound==0)
        {
            this.hideStatusAlert();
            $("button#launchPlayers").prop("disabled", false);
        }
        else
        {
            $("button#launchPlayers").prop("disabled", true);
        }

        return errors;
    }

    onGetVirtualPlayerTaskSchedulesResponse = (data) =>
    {
        this._schedules = data.Schedules;

        var optionHtml="<option value=\"\">Please select a schedule</option>";
        this._schedules?.map(schedule =>
        {
            optionHtml += "<option value=\"" + schedule.ScheduleId + "\">" + schedule.ScheduleName + "</option>";
        });

        $('#'+this._domId).find("#scheduleId").html(optionHtml);
        $('#'+this._domId).find('.launchPlayersForm').show();
        $('#'+this._domId).find('.loadingMessage').hide();
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

    onLaunchVirtualPlayerTaskScheduleResponse = (data) =>
    {
        $("button#launchPlayers").prop("disabled", false);
        if (data.Result==true)
        {
            this._emitter.emit(Events.SWITCH_SUB_POPUP, { SubPopup: SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP });
        }
        else
        {
            this.showFailureAlert("Error launching schedule!");
        }
    }

    onLaunchVirtualPlayersProgressResponse = (data) =>
    {
        this.setLaunchProgressText(data.NumLaunched + " of " + data.TotalToLaunch + " player tasks launched");
    }

    onGetTaskDefinitionsResponse = (data) =>
    {
        Network.sendObject({Type:"GetVirtualPlayerTaskSchedules"});

        var optionHtml="<option value=\"\">Please select a task definition</option>";
        data.TaskDefinitions?.map(taskDefinition =>
        {
            optionHtml += "<option value=\"" + taskDefinition.TaskDefinitionArn + "\">" + taskDefinition.Family + "</option>";
        });

        $('#'+this._domId).find("#taskDefinition").html(optionHtml);
    };


    onPopupClick = async (event) => {

        event.stopPropagation();
        let el = $(event.target);

        if (el.attr("id") == "launchPlayers")
        {
            if (this.validateForm())
            {
                const scheduleType = this.getScheduleType();
                const numPlayers = $('#'+this._domId).find("#numPlayers").val();
                const taskDefinitionArn = $('#'+this._domId).find("#taskDefinition").val();
                const fargateCapacityProvider = $("input[name='fargateCapacityProvider']:checked").val();

                if (scheduleType=="taskLaunch")
                {
                    if (numPlayers<1 || numPlayers>500)
                    {
                        $('#'+this._domId).find("#errorText").attr("class", "errorText");
                    }
                    else
                    {
                        $("button#launchPlayers").prop("disabled", true);
                        $('#'+this._domId).find("#errorText").attr("class", "errorText hide");
                        this.setLaunchProgressText("Launching Virtual Player Tasks...");
                        Network.sendObject({Type:"LaunchVirtualPlayerTasks", NumPlayers:numPlayers, TaskDefinitionArn:taskDefinitionArn, CapacityProvider:fargateCapacityProvider});
                    }
                }
                else
                if (scheduleType=="scheduleLaunch")
                {
                    const scheduleId = $('#'+this._domId).find("#scheduleId").val();
                    $("button#launchPlayers").prop("disabled", true);
                    $('#'+this._domId).find("#errorText").attr("class", "errorText hide");
                    Network.sendObject({Type:"LaunchVirtualPlayerTaskSchedule", ScheduleId: scheduleId, TaskDefinitionArn:taskDefinitionArn, CapacityProvider:fargateCapacityProvider});
                }
            }
        }

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }

        if (el.hasClass("createSchedule"))
        {
            this._emitter.emit(Events.SWITCH_SUB_POPUP, {SubPopup: SubPopups.VIRTUAL_PLAYER_TASKS_SCHEDULES_SUB_POPUP, Page:Pages.VIRTUAL_PLAYER_TASK_SCHEDULES_FORM});
        }

        if (el.hasClass("viewExistingSchedule"))
        {
            this._emitter.emit(Events.SWITCH_SUB_POPUP, {SubPopup: SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP });
        }
    };

}