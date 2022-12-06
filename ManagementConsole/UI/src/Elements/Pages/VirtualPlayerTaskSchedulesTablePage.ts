// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {PageManager} from "./PageManager";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {DataTypes} from "../../Data/DataTypes";
import VirtualPlayerTaskSchedule = DataTypes.VirtualPlayerTaskSchedule;

export class VirtualPlayerTaskSchedulesTablePage extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_TASK_SCHEDULES_TABLE;
    public static cacheKey = this.id;
    protected _taskSchedules:VirtualPlayerTaskSchedule[] = [];

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerTaskSchedulesTablePage.cacheKey, parentPage, VirtualPlayerTaskSchedulesTablePage.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }

        if (el.attr("id") == "createSchedule")
        {
            PageManager.switchPage(Pages.VIRTUAL_PLAYER_TASK_SCHEDULES_FORM);
        }

        if (el.hasClass("viewSchedule"))
        {
            PageManager.switchPage(Pages.VIRTUAL_PLAYER_TASK_SCHEDULE_VIEW, el.data("scheduleid"));
        }

        if (el.hasClass("deleteSchedule"))
        {
            this.deleteSchedule(el.data("scheduleid"));
        }
    }

    deleteSchedule = (scheduleId) =>
    {
        Network.sendObject({Type:"DeleteVirtualPlayerTaskSchedule", ScheduleId: scheduleId });
    };

    refresh()
    {
        Network.sendObject({Type:"GetVirtualPlayerTaskSchedules"});
    }

    initPage()
    {
        this.refresh();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, this.onGetVirtualPlayerTaskSchedulesResponse);
        this._emitter.on(Events.DELETE_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onDeleteVirtualPlayerTaskScheduleResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, this.onGetVirtualPlayerTaskSchedulesResponse);
        this._emitter.off(Events.DELETE_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onDeleteVirtualPlayerTaskScheduleResponse);
    }

    onDeleteVirtualPlayerTaskScheduleResponse = (data) =>
    {
        if (data.Errors.length==0)
        {
            PageManager.switchPage(Pages.VIRTUAL_PLAYER_TASK_SCHEDULES_TABLE, null);
        }
        else
        {
            this.showFailureAlert(data.Errors[0]);
        }
    };

    onGetVirtualPlayerTaskSchedulesResponse = (data) =>
    {
        let html="";
        this._taskSchedules = data.Schedules;

        let lastActionTime=0;
        this._taskSchedules.map(schedule =>
        {
            let totalTasks = 0;
            schedule.Actions.map(action => {
                if (action.Type=="Launch")
                {
                    totalTasks+=action.NumTasks;
                }
                lastActionTime = action.Minutes;
            });

            html += '<tr>' +
                '<td>' + schedule.ScheduleName + '</td>'+
                '<td>' + totalTasks + '</td>'+
                '<td>' + lastActionTime + ' minutes</td>'+
                '<td><a class="viewSchedule btn btn-primary btn-sm" data-scheduleid="' + schedule.ScheduleId +'" href="' + "#" + '">View</a></td>' +
                '<td><a class="deleteSchedule btn btn-primary btn-sm" data-scheduleid="' + schedule.ScheduleId +'" href="' + "#" + '">Delete</a></td>' +
                '</tr>';
        });

        this.resetElement(".virtualPlayerTaskSchedulesTableContainer");

        $("table#virtualPlayerTaskSchedulesTable tbody").html(html);
        this.activateDataTable("virtualPlayerTaskSchedulesTable");
    };

}