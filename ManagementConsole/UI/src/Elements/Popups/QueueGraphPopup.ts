// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSessionQueue = DataTypes.GameSessionQueue;

export class QueueGraphPopup extends Popup
{
    protected _queueConfigData: GameSessionQueue;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="simpleGraphPopup";
        this.setupEventListeners();
        this.refresh = this.refresh.bind(this);
    }

    setPopupData(data:any)
    {
        this._queueConfigData = data;
        console.log(this._queueConfigData);

        var options= [
            "AverageWaitTime",
            "QueueDepth",
            "PlacementsStarted",
            "PlacementsSucceeded",
            "PlacementsTimedOut",
        ];
        this._popup.node.querySelector("#timeperiod").addEventListener("change", this.refresh, false);
        options.map((option)=>
        {
            this._popup.node.querySelector("#metric").innerHTML += '<option value="' + option + '">' + option + '</option>';
        })

        this._popup.node.querySelector("#metric").addEventListener("change", this.refresh, false);

        this.refresh();
    }


    onGetCloudWatchGraphResponse = (data) =>
    {
        console.log("GOT CLOUDWATCH GRAPH:", data);

        var html='<img style="display:block; margin-left:auto; margin-right:auto" src="data:image/png;base64, ' + data.Image + '"/>';
        this._popup.node.querySelector("div#graphImg").innerHTML = html;
        this._popup.node.querySelector("#timeperiod").addEventListener("change", this.refresh, false);
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }

        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }

    };

    setupEventListeners()
    {
        this._emitter.on(Events.GET_CLOUDWATCH_GRAPH_RESPONSE, this.onGetCloudWatchGraphResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_CLOUDWATCH_GRAPH_RESPONSE, this.onGetCloudWatchGraphResponse);
    }

    refresh()
    {
        var image = {
            "view": "timeSeries",
            "stacked": false,
            "metrics": [
                [ "AWS/GameLift", (this._popup.node.querySelector("#metric") as HTMLInputElement).value, "QueueName", this._queueConfigData.Name ]
            ],
            "region": "eu-west-1",
            "start" : (this._popup.node.querySelector("#timeperiod") as HTMLInputElement).value
        }

        Network.sendObject({Type:"GetCloudWatchGraph", MetricWidgetJson:JSON.stringify(image)});
    }

    activateDataTable(id) {
        // @ts-ignore
        $('#'+id).DataTable({
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            order: [[ 0, "desc" ]]
        });
    }
}