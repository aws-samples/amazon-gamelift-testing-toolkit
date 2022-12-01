// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";

export class VirtualPlayerLaunchRequestTaskLogs extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_LAUNCH_REQUEST_TASK_LOGS;
    public static cacheKey = "virtualPlayerLaunchRequestTaskLogs";
    protected _launchRequest:any = {};
    protected _logGroup:string = null;
    protected _logStream:string = null;

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerLaunchRequestTaskLogs.cacheKey, parentPage, VirtualPlayerLaunchRequestTaskLogs.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.attr("id")=="backButton") // show tasks list
        {
            this.goBack(this._launchRequest);
        }
    }

    refreshLogs()
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetCloudWatchLogs", LogGroup:this._logGroup, LogStream: this._logStream});
    }

    public setPageData(data:any)
    {
        console.log(data);
        this._launchRequest = data.LaunchRequest;
        this._logGroup = data.LogGroup;
        this._logStream = data.LogStream;
    }

    initPage()
    {
        this.resetPage();
        this.refreshLogs();
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_CLOUDWATCH_LOGS_RESPONSE, this.onGetCloudWatchLogsResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_CLOUDWATCH_LOGS_RESPONSE, this.onGetCloudWatchLogsResponse);
    }

    onGetCloudWatchLogsResponse = (data) =>
    {
        this.resetElement(".virtualPlayerTaskLogs");
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

            $('#virtualPlayersTaskLogsTable tbody').html(html);

            this.activateDataTable("virtualPlayersTaskLogsTable");
            //this.refresh();
        }
    };
}