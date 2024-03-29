// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import FleetData = DataTypes.FleetData;
import {Game} from "../../Game";

export class FleetGraphPopup extends Popup
{
    protected _fleetConfigData: FleetData;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="simpleGraphPopup";
        this.setupEventListeners();
        this.refresh = this.refresh.bind(this);
    }

    setPopupData(data:any)
    {
        this._fleetConfigData = data;
        var options= [
            "AvailableGameSessions",
            "ActiveInstances",
            "IdleInstances",
            "MinInstances",
            "DesiredInstances",
            "MaxInstances",
            "PercentHealthyServerProcesses",
            "ServerProcessActivations",
            "ServerProcessTerminations",
            "CurrentPlayerSessions",
            "PlayerSessionActivations",
            "HealthyServerProcesses"
        ];

        this.element.find("#timeperiod").on("change", this.refresh);
        options.map((option)=>
        {
            this.element.find("#metric").append('<option value="' + option + '">' + option + '</option>');
        })

        this.element.find("#metric").on("change", this.refresh);
        this.refresh();
    }


    onGetCloudWatchGraphResponse = (data) =>
    {
        var html='<img style="display:block; margin-left:auto; margin-right:auto" src="data:image/png;base64, ' + data.Image + '"/>';
        this.element.find("div#graphImg").html(html);
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

        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }

    };

    setupEventListeners()
    {
        super.setupEventListeners();
        this._emitter.on(Events.GET_CLOUDWATCH_GRAPH_RESPONSE, this.onGetCloudWatchGraphResponse);
    }

    removeEventListeners()
    {
        super.removeEventListeners();
        this._emitter.off(Events.GET_CLOUDWATCH_GRAPH_RESPONSE, this.onGetCloudWatchGraphResponse);
    }

    refresh()
    {
        let configObj = Game.game.cache.json.get("configJson");

        var image = {
            "view": "timeSeries",
            "stacked": false,
            "metrics": [
                [ "AWS/GameLift", (this.element.find("#metric")[0] as HTMLInputElement).value, "FleetId", this._fleetConfigData.FleetId ]
            ],
            "region": configObj.Region,
            "start" : (this.element.find("#timeperiod")[0] as HTMLInputElement).value
        }

        Network.sendObject({Type:"GetCloudWatchGraph", MetricWidgetJson:JSON.stringify(image)});
    }

}