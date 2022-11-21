// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSession = DataTypes.GameSession;
const jp = require('jsonpath');
const parser = require('aws-arn-parser');

export class ManageVirtualPlayersPopup extends Popup
{
    protected _gameSessions: GameSession[];
    protected _currentGameSession: GameSession;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="virtualPlayersTablePopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetVirtualPlayers"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_VIRTUAL_PLAYERS_RESPONSE, this.onGetVirtualPlayersResponse);
        this._emitter.on(Events.GET_CLOUDWATCH_LOGS_RESPONSE, this.onGetCloudWatchLogsResponse);
        this._emitter.on(Events.TERMINATE_VIRTUAL_PLAYER_RESPONSE, this.onTerminateVirtualPlayerResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_VIRTUAL_PLAYERS_RESPONSE, this.onGetVirtualPlayersResponse);
        this._emitter.off(Events.GET_CLOUDWATCH_LOGS_RESPONSE, this.onGetCloudWatchLogsResponse);
        this._emitter.off(Events.TERMINATE_VIRTUAL_PLAYER_RESPONSE, this.onTerminateVirtualPlayerResponse);
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

    hideStatusAlert = () =>
    {
        this.element.find("#statusText").attr("class", "alert hide");
    }

    onTerminateVirtualPlayerResponse = (data) =>
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
        this.resetElement("virtualPlayersLogsTable");
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

            console.log(html);
            $('#virtualPlayersLogsTable tbody').html(html);
            $('.virtualPlayersContent').hide();
            $('.virtualPlayersLogsContent').show();

            this.activateDataTable("virtualPlayersLogsTable");
            //this.refresh();
        }
    };

    resetVirtualPlayersTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this.element.find("#virtualPlayersTable_wrapper")?.remove();
        if (this.element.find("table#virtualPlayersTable").length==0)
        {
            this.element.find(".virtualPlayersContent").append(element.querySelector("#virtualPlayersTable"));
        }
    }

    onGetVirtualPlayersResponse = (data) =>
    {
        this._gameSessions = data;

        let html="";

        data.Tasks?.map(task =>
        {
            let playerTerminateTd='<td><a class="terminatePlayer btn btn-primary btn-sm" id="' + task.TaskArn +'" href="' + "#" + '">Terminate</a></td>';

            let taskDef=null;
            let logOptions=null;
            let logGroup=null;
            let logStream=null;
            if (data.TaskDefinitions!=null)
            {
                taskDef = data.TaskDefinitions.find(taskDefinition => taskDefinition.TaskDefinitionArn == task.TaskDefinitionArn);

                if (taskDef)
                {
                    console.log("FOUND TASK DEF");
                    let logOptionsSearch = jp.query(taskDef, "$.ContainerDefinitions[0].LogConfiguration.Options");
                    let containerSearch = jp.query(taskDef, "$.ContainerDefinitions[0]");

                    if (logOptionsSearch.length && containerSearch.length)
                    {
                        console.log("FOUND OPTIONS");
                        logOptions = logOptionsSearch[0];
                        logGroup = logOptions["awslogs-group"];
                        const parts = task.TaskArn.split("/");
                        const taskId = parts.pop();
                        logStream = logOptions["awslogs-stream-prefix"] + "/" + containerSearch[0].Name + "/" + taskId;
                    }
                }

            }


            let playerLogsTd='<td></td>';
            if (logStream!=null && logGroup!=null)
            {
                playerLogsTd='<td><a class="viewLogs btn btn-primary btn-sm" data-loggroup="' + logGroup +'" data-logstream="' + logStream + '" href="' + "#" + '">Logs</a></td>';
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

        this.resetVirtualPlayersTable();

        $("table#virtualPlayersTable tbody").html(html);
        this.activateDataTable("virtualPlayersTable");
    };


    onPopupClick = async (event) => {

        event.stopPropagation();
        let el = $(event.target);

        if (el.hasClass("closeButton"))
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }
        if (el.hasClass("terminatePlayer"))
        {
            Network.sendObject({Type:"TerminateVirtualPlayer", TaskArn:event.target.id});
        }
        if (el.hasClass("terminateAllVirtualPlayers"))
        {
            Network.sendObject({Type:"TerminateAllVirtualPlayers"});
        }

        if (el.attr("id") == "backButton")
        {
            $('.virtualPlayersContent').show();
            $('.virtualPlayersLogsContent').hide();
        }

        if (el.hasClass("viewLogs"))
        {
            console.log(el);
            console.log(el.data("loggroup"));
            console.log(el.data("logstream"));

            Network.sendObject({Type:"GetCloudWatchLogs", LogGroup:el.data("loggroup"), LogStream: el.data("logstream")});
        }
    };
}