// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {SubPopup} from "../Abstract/SubPopup";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {SubPopups} from "./SubPopups";

export class VirtualPlayerTasksRunningSubPopup extends SubPopup
{
    public static id = SubPopups.VIRTUAL_PLAYER_TASKS_RUNNING_SUB_POPUP;
    public static cacheKey = this.id;

    protected _logGroup:string = null;
    protected _logStream:string = null;

    public constructor ()
    {
        super(VirtualPlayerTasksRunningSubPopup.cacheKey, VirtualPlayerTasksRunningSubPopup.id);
    }

    loadingComplete()
    {
        this.selector.find('.virtualPlayerTasksRunningContent').show();
        this.selector.find('.loadingMessage').hide();
    }

    refresh()
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetVirtualPlayerTasks"});
    }

    refreshLogs()
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetCloudWatchLogs", LogGroup:this._logGroup, LogStream: this._logStream});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onGetVirtualPlayerTasksResponse);
        this._emitter.on(Events.GET_CLOUDWATCH_LOGS_RESPONSE, this.onGetCloudWatchLogsResponse);
        this._emitter.on(Events.TERMINATE_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onTerminateVirtualPlayerTasksResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onGetVirtualPlayerTasksResponse);
        this._emitter.off(Events.GET_CLOUDWATCH_LOGS_RESPONSE, this.onGetCloudWatchLogsResponse);
        this._emitter.off(Events.TERMINATE_VIRTUAL_PLAYER_TASKS_RESPONSE, this.onTerminateVirtualPlayerTasksResponse);
    }

    onTerminateVirtualPlayerTasksResponse = (data) =>
    {
        if (data.Errors && data.Errors.length)
        {
            this.showFailureAlert(data.Errors[0]);
        }
        else
        {
            this.refresh();
        }
    };

    onGetCloudWatchLogsResponse = (data) =>
    {
        this.resetElement(".virtualPlayersLogsContent");
        if (data.ErrorMessage!=null)
        {
            this.showFailureAlert(data.ErrorMessage);
        }
        else
        {
            let html="";

            data.LogEvents.map((event)=>
            {
                html+='<tr><td>' + event.Timestamp + '</td><td>' + event.Message + '</td></tr>';
            });

            $('#virtualPlayersLogsTable tbody').html(html);
            $('.virtualPlayersContent').hide();
            $('.virtualPlayersLogsContent').show();

            this.activateDataTable("virtualPlayersLogsTable");
            //this.refresh();
        }
    };

    onGetVirtualPlayerTasksResponse = (data) =>
    {
        let html="";

        data.Tasks?.map(task =>
        {
            let playerTerminateTd='<td><a class="terminateVirtualPlayerTask btn btn-primary btn-sm" id="' + task.TaskArn +'" href="' + "#" + '">Terminate</a></td>';

            let playerLogsTd='<td></td>';
            if (task.LogStream!=null && task.LogGroup!=null)
            {
                playerLogsTd='<td><a class="viewLogs btn btn-primary btn-sm" data-loggroup="' + task.LogGroup +'" data-logstream="' + task.LogStream + '" href="' + "#" + '">Logs</a></td>';
            }

            html += '<tr>' +
                '<td>' + task.CreatedAt + '</td>'+
                '<td>' + task.TaskArn + '</td>'+
                '<td>' + task.CapacityProviderName + '</td>'+
                '<td>' + task.LastStatus + '</td>'+
                '<td>' + task.Cpu + '</td>'+
                '<td>' + task.Memory + '</td>'+
                playerTerminateTd +
                playerLogsTd +
                '</tr>';
        });

        this.resetElement(".virtualPlayersTableContainer");

        $("table#virtualPlayersTable tbody").html(html);
        this.loadingComplete();
        this.activateDataTable("virtualPlayersTable");
    };


    onPopupClick = async (event) => {

        event.stopPropagation();
        let el = $(event.target);

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }
        if (el.hasClass("refreshLogsButton"))
        {
            this.refreshLogs();
        }
        if (el.hasClass("terminateVirtualPlayerTask"))
        {
            Network.sendObject({Type:"TerminateVirtualPlayerTask", TaskArn:event.target.id});
        }
        if (el.hasClass("terminateAllVirtualPlayerTasks"))
        {
            Network.sendObject({Type:"TerminateAllVirtualPlayerTasks"});
        }

        if (el.attr("id") == "backButton")
        {
            $('.virtualPlayersContent').show();
            $('.virtualPlayersLogsContent').hide();
        }

        if (el.hasClass("viewLogs"))
        {
            this._logGroup = el.data("loggroup");
            this._logStream = el.data("logstream");
            this.refreshLogs();
        }
    };
}