// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {PageManager} from "./PageManager";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";

export class VirtualPlayerLaunchRequests extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_LAUNCH_REQUESTS;
    public static cacheKey = "virtualPlayerLaunchRequests";
    protected _taskHistory:any[];

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerLaunchRequests.cacheKey, parentPage, VirtualPlayerLaunchRequests.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }

        if (el.hasClass("viewTasks"))
        {
            let launchRequest = this._taskHistory.find(x => x.LaunchId == el.data("launchid"));
            PageManager.switchPage(Pages.VIRTUAL_PLAYER_LAUNCH_REQUEST_TASKS, launchRequest);
        }
    }

    refresh()
    {
        Network.sendObject({Type:"GetVirtualPlayerLaunchTaskRequests"});
    }

    initPage()
    {
        this.refresh();
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_LAUNCH_TASK_REQUESTS_RESPONSE, this.onGetVirtualPlayerLaunchTaskRequestsResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_LAUNCH_TASK_REQUESTS_RESPONSE, this.onGetVirtualPlayerLaunchTaskRequestsResponse);
    }

    onGetVirtualPlayerLaunchTaskRequestsResponse = (data) =>
    {
        let html="";
        this._taskHistory = data.LaunchTaskRequests;

        this._taskHistory.map(launchRequest =>
        {
            let scheduleId="-";
            if (launchRequest.ScheduleId!=null)
            {

            }

            html += '<tr>' +
                '<td>' + launchRequest.Time + '</td>'+
                '<td>' + scheduleId + '</td>'+
                '<td>' + launchRequest.Tasks.length + '</td>'+
                '<td><a class="viewTasks btn btn-primary btn-sm" data-launchid="' + launchRequest.LaunchId +'" href="' + "#" + '">View Tasks</a></td>' +
                '</tr>';
        });

        this.resetElement(".virtualPlayersHistoryTableContainer");

        $("table#virtualPlayersHistoryTable tbody").html(html);
        this.activateDataTable("virtualPlayersHistoryTable");
    };

}