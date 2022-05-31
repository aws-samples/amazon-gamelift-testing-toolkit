// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Fleet} from "../Fleet";
import DOMElement = Phaser.GameObjects.DOMElement;
import {Network} from "../../Network/Network";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Rectangle = Phaser.GameObjects.Rectangle;
import config from "../../Config/Config"
import {Popup} from "../Abstract/Popup";
import Instance = DataTypes.Instance;
import GameSession = DataTypes.GameSession;
import JSONEditor, {JSONEditorOptions} from "jsoneditor";
import {MatchmakingConfig} from "../MatchmakingConfig";
import MatchmakingConfiguration = DataTypes.MatchmakingConfiguration;
import GameSessionQueue = DataTypes.GameSessionQueue;
import FleetData = DataTypes.FleetData;

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
        this._popup.node.querySelector("#timeperiod").addEventListener("change", this.refresh, false);
        options.map((option)=>
        {
            this._popup.node.querySelector("#metric").innerHTML += '<option value="' + option + '">' + option + '</option>';
        })
        //var options = '<option value="AvailableGameSessions">AvailableGameSessions</option>';
        //this._popup.node.querySelector("#metric").innerHTML = options;
        this._popup.node.querySelector("#metric").addEventListener("change", this.refresh, false);
        this.refresh();

        /*
        this._popup.getChildByID("gameSessionId").innerHTML=gameSessionData.GameSessionId;
        this._popup.getChildByID("ipAddress").innerHTML=gameSessionData.IpAddress;
        this._popup.getChildByID("dnsName").innerHTML=gameSessionData.DnsName;
        this._popup.getChildByID("region").innerHTML=gameSessionData.Location;
        this._popup.getChildByID("currentPlayerSessions").innerHTML=gameSessionData.CurrentPlayerSessionCount + "/" + gameSessionData.MaximumPlayerSessionCount;
        this._popup.getChildByID("instanceStatus").innerHTML=gameSessionData.Status.Value;
        this._popup.getChildByID("creationDate").innerHTML=new Date(gameSessionData.CreationTime).toISOString();

         */
    }


    onGetCloudWatchGraphResponse = (data) =>
    {
        console.log("GOT CLOUDWATCH GRAPH:", data);

        var html='<img style="display:block; margin-left:auto; margin-right:auto" src="data:image/png;base64, ' + data.Image + '"/>';
        this._popup.node.querySelector("div#graphImg").innerHTML = html;


        //var img = atob(data.Image);
        //console.log(img);
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        //console.log(event.target.className);
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
                [ "AWS/GameLift", (this._popup.node.querySelector("#metric") as HTMLInputElement).value, "FleetId", this._fleetConfigData.FleetId ]
            ],
            "region": "eu-west-1",
            "start" : (this._popup.node.querySelector("#timeperiod") as HTMLInputElement).value
        }

        Network.sendObject({Type:"GetCloudWatchGraph", MetricWidgetJson:JSON.stringify(image)});
    }

}