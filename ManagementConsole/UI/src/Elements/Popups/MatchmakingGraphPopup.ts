// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import MatchmakingConfiguration = DataTypes.MatchmakingConfiguration;
import {Game} from "../../Game";

export class MatchmakingGraphPopup extends Popup
{
    protected _ticketEvents: any[];
    protected _matchmakingConfigData: MatchmakingConfiguration;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="simpleGraphPopup";
        this.setupEventListeners();
        this.refresh = this.refresh.bind(this);
    }

    setPopupData(data:any)
    {
        this._matchmakingConfigData = data;

        var options= [
            "TimeToMatch",
            "MatchmakingSearchTime",
            "CurrentTickets",
            "MatchesCreated",
            "PlayersStarted",
            "TicketsTimedOut",
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
        this.element.find("#timeperiod").on("change", this.refresh);
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
        let configObj = Game.game.cache.json.get("configJson");

        var image = {
            "view": "timeSeries",
            "stacked": false,
            "metrics": [
                [ "AWS/GameLift", (this.element.find("#metric")[0] as HTMLInputElement).value, "ConfigurationName", this._matchmakingConfigData.Name]
            ],
            "region": configObj.Region,
            "start" : (this.element.find("#timeperiod")[0] as HTMLInputElement).value
        }

        Network.sendObject({Type:"GetCloudWatchGraph", MetricWidgetJson:JSON.stringify(image)});
    }
}