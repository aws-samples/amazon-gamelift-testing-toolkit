// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {Utils} from "../../Utils/Utils";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {DataTypes} from "../../Data/DataTypes";
import VirtualPlayerTaskSchedule = DataTypes.VirtualPlayerTaskSchedule;
import VirtualPlayerTasksQuotas = DataTypes.VirtualPlayerTasksQuotas;
import VirtualPlayerTaskScheduleAction = DataTypes.VirtualPlayerTaskScheduleAction;
import {PageManager} from "./PageManager";

export class VirtualPlayerTaskScheduleViewPage extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_TASK_SCHEDULE_VIEW;
    public static cacheKey = this.id;
    protected _schedule: VirtualPlayerTaskSchedule = {};
    protected _scheduleId: string = null;

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerTaskScheduleViewPage.cacheKey, parentPage, VirtualPlayerTaskScheduleViewPage.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }

        if (el.attr("id")=="backButton") // show requests list
        {
            this.goBack();
        }
    }

    updateScheduleTable = () =>
    {
        this.resetElement(".virtualPlayerTaskScheduleViewTableContainer");

        $("h4#scheduleName").html(this._schedule.ScheduleName);

        let runningTotal=0;

        let tableHtml="";
        this._schedule.Actions.map(action =>
        {
            if (action.Type=="Launch")
            {
                runningTotal += action.NumTasks;
            }
            else
            if (action.Type=="Terminate")
            {
                runningTotal -= action.NumTasks;
            }

            tableHtml += '<tr><td>' + Utils.formatMinutes(action.Minutes) + '</td><td>' + action.Type + '</td><td>' + action.NumTasks + ' tasks</td><td>' + runningTotal + '</td></tr>';
        });

        $("table#virtualPlayerTaskScheduleViewTable tbody").append(tableHtml);

        this.activateDataTable("virtualPlayerTaskScheduleViewTable", {
            scrollY: "420px",
            dom: "ti",
            paging: false,
            scrollCollapse: true,
            columnDefs: [
                {width: 200, targets: 0}
            ],
            order: [[0, "asc"]],
            ordering: false,
        });
    }

    public setPageData(data:any)
    {
        this._scheduleId = data;
        console.log(this._scheduleId);
    }

    refresh()
    {
    }

    initPage()
    {
        $("#scheduleName").val("");
        Network.sendObject({Type:"GetVirtualPlayerTaskSchedule", ScheduleId:this._scheduleId});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onGetVirtualPlayerTaskScheduleResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onGetVirtualPlayerTaskScheduleResponse);
    }

    onGetVirtualPlayerTaskScheduleResponse = (data) =>
    {
        console.log(data);
        this._schedule = data.Schedule;
        this.updateScheduleTable();
    };

    setupPage()
    {
    }

}