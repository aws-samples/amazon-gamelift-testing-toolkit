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
import {SubPopups} from "../SubPopups/SubPopups";

export class VirtualPlayerTasksOverviewPage extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_TASKS_OVERVIEW;
    public static cacheKey = this.id;
    protected _taskSchedules:VirtualPlayerTaskSchedule[] = [];
    protected _launchId=null;

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerTasksOverviewPage.cacheKey, parentPage, VirtualPlayerTasksOverviewPage.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }

        if (el.hasClass("terminateSchedule"))
        {
            $("button.terminateSchedule").prop("disabled", true);
            $("p.terminateText").html("Terminating schedule...");
            Network.sendObject({Type:"TerminateSchedule", LaunchId:this._launchId});
        }
    }

    refresh()
    {
        Network.sendObject({Type:"GetSchedulerSchedules"});
    }

    initPage()
    {
        this.refresh();
    }

    setupEventListeners()
    {
        //this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, this.onGetVirtualPlayerTaskSchedulesResponse);
        this._emitter.on(Events.GET_SCHEDULER_SCHEDULES_RESPONSE, this.onGetSchedulerSchedulesResponse);
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onGetVirtualPlayerTasksResponse);
        this._emitter.on(Events.GET_LAUNCH_REQUEST_RESPONSE, this.onGetLaunchRequestResponse);
        this._emitter.on(Events.TERMINATE_SCHEDULE_RESPONSE, this.onTerminateScheduleResponse);
        this._emitter.on(Events.SCHEDULE_PROGRESS, this.onScheduleProgress);
    }

    removeEventListeners()
    {
        //this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULES_RESPONSE, this.onGetVirtualPlayerTaskSchedulesResponse);
        this._emitter.off(Events.GET_SCHEDULER_SCHEDULES_RESPONSE, this.onGetSchedulerSchedulesResponse);
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onGetVirtualPlayerTasksResponse);
        this._emitter.off(Events.GET_LAUNCH_REQUEST_RESPONSE, this.onGetLaunchRequestResponse);
        this._emitter.on(Events.TERMINATE_SCHEDULE_RESPONSE, this.onTerminateScheduleResponse);
        this._emitter.off(Events.SCHEDULE_PROGRESS, this.onScheduleProgress);
    }

    onTerminateScheduleResponse = (data) =>
    {
        this._emitter.emit(Events.SWITCH_SUB_POPUP, { SubPopup: SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP });
    }

    onGetVirtualPlayerTasksResponse = (data) =>
    {
        let runningTasks="no";
        if (data.Tasks.length)
        {
            runningTasks = data.Tasks.length;
        }

        this.selector.find("span.runningTasks").html(runningTasks);
        this.loadingComplete();
    };

    onGetLaunchRequestResponse = (data) =>
    {
        $('.runningScheduleTableContainer').show();
        this.loadingComplete();

        this.updateRunningScheduleTable(data.LaunchRequest.Schedule);

    };

    onScheduleProgress = (data) =>
    {
        Network.sendObject({Type:"GetVirtualPlayerTasks"});
        this.updateRunningScheduleTable(data.Schedule, data.ActionIndex);
    };

    updateRunningScheduleTable(schedule, flashIndex=null)
    {
        if (schedule.Actions.find(x=>x.Status=="Scheduled")==undefined)
        {
            $('.runningScheduleTableTitle').html("Completed schedule " + schedule.ScheduleName);
            $('div.terminateSchedule').hide();
            $('.completedSchedule').show();
            this._launchId=null;
        }
        else
        {
            $('.runningScheduleTableTitle').html("Running schedule " + schedule.ScheduleName);
            $('div.terminateSchedule').show();
            $('.completedSchedule').hide();
        }

        let tableHtml="";
        schedule.Actions.map(action =>
        {
            tableHtml += '<tr>'
                + '<td>' + action.ScheduledTime + '</td>'
                + '<td>' + action.Type + '</td>'
                + '<td>' + action.NumTasks + '</td>'
                + '<td>' + action.Status + '</td>'
                + '<td>' + action.StartedTime + '</td>'
                + '</tr>';
        })

        $('#runningScheduleTable tbody').html(tableHtml);

        this.activateDataTable('runningScheduleTable', {
            scrollY: "280px",
            dom: "ti",
            paging: false,
            scrollCollapse: true,
            columnDefs: [
                {width: 200, targets: 0}
            ],
            order: [[0, "asc"]],
            ordering: false,
        });

        if (flashIndex!=null)
        {
            let row = $('#runningScheduleTable tbody tr')[flashIndex];
            if (schedule.Actions[flashIndex].Status=="Completed")
            {
                $(row).addClass('successFlash');
            }
            else
            if (schedule.Actions[flashIndex].Status=="Failed")
            {
                $(row).addClass('failureFlash');
            }
        }
    }

    loadingComplete()
    {
        this.selector.find('.overviewPage').show();
        this.selector.find('.loadingMessage').hide();
    }

    onGetSchedulerSchedulesResponse = (data) =>
    {
        if (data.Schedules.LaunchSchedule.State.Value=="DISABLED" && data.Schedules.TerminateSchedule.State.Value=="DISABLED")
        {
            this.selector.find("span.scheduleInfo").html("There is no schedule running.");

        }
        else
        {
            let inputObj = JSON.parse(data.Schedules.LaunchSchedule.Target.Input)
            let launchId = inputObj["LaunchId"];
            this._launchId = launchId;
            Network.sendObject({Type:"GetLaunchRequest", LaunchId: launchId});
        }

        Network.sendObject({Type:"GetVirtualPlayerTasks"});
    };

}