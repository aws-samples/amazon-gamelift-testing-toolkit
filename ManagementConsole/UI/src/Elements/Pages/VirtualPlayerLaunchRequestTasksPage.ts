// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {PageManager} from "./PageManager";

export class VirtualPlayerLaunchRequestTasksPage extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_LAUNCH_REQUEST_TASKS;
    public static cacheKey = this.id;

    protected _launchRequest:any = {};

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerLaunchRequestTasksPage.cacheKey, parentPage, VirtualPlayerLaunchRequestTasksPage.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.attr("id")=="backButton") // show requests list
        {
            this.goBack();
        }

        if (el.hasClass("viewLogs"))
        {
            PageManager.switchPage(Pages.VIRTUAL_PLAYER_LAUNCH_REQUEST_TASK_LOGS, {LogGroup: el.data("loggroup"), LogStream:el.data("logstream"), LaunchRequest:this._launchRequest});
        }
    }

    public setPageData(data:any)
    {
        this._launchRequest = data;
    }

    populateLaunchRequestTasks = () =>
    {
        let html="";

        this._launchRequest.Tasks?.map(task =>
        {
            let playerLogsTd='<td></td>';
            if (task.LogStream!=null && task.LogGroup!=null)
            {
                playerLogsTd='<td><a class="viewLogs btn btn-primary btn-sm" data-loggroup="' + task.LogGroup +'" data-logstream="' + task.LogStream + '" href="' + "#" + '">Logs</a></td>';
            }

            html += '<tr>' +
                '<td>' + task.CreatedAt + '</td>'+
                '<td>' + task.TaskArn + '</td>'+
                '<td>' + task.CapacityProviderName + '</td>'+
                '<td>' + task.Cpu + '</td>'+
                '<td>' + task.Memory + '</td>'+
                playerLogsTd +
                '</tr>';
        });

        this.resetElement(".virtualPlayerLaunchRequestTasksTableContainer");

        $("table#virtualPlayerLaunchRequestTasksTable tbody").html(html);
        this.activateDataTable("virtualPlayerLaunchRequestTasksTable");
    };

    initPage() {
        this.resetPage();
        this.populateLaunchRequestTasks();
    }

    setupEventListeners() {
    }

    removeEventListeners() {
    }
}