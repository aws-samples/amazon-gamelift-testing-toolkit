// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import GameSession = DataTypes.GameSession;
import MatchmakingConfiguration = DataTypes.MatchmakingConfiguration;

export class MatchmakingConfigPopup extends Popup
{
    protected _gameSessions: GameSession[];
    protected _currentGameSession: GameSession;
    protected _matchmakingConfig: MatchmakingConfiguration;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="matchmakingConfigPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
        this._matchmakingConfig = data as MatchmakingConfiguration;
    }

    refresh()
    {
        Network.sendObject({Type:"GetMatchmakingRuleSets"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRulesetsResponse);
        this._emitter.on(Events.UPDATE_MATCHMAKING_CONFIGURATION_RESPONSE, this.onUpdateMatchmakingConfigurationResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRulesetsResponse);
        this._emitter.off(Events.UPDATE_MATCHMAKING_CONFIGURATION_RESPONSE, this.onUpdateMatchmakingConfigurationResponse);
    }

    onUpdateMatchmakingConfigurationResponse = (data) =>
    {
        if (data.Updated)
        {
            this.showSuccessAlert("Matchmaking Configuration updated successfully");
        }
        else
        {
            this.showFailureAlert("Error: " + data.ErrorMessage);
        }
    };

    onGetMatchmakingRulesetsResponse = (data) =>
    {
        var optionHtml="";
        data?.map(ruleSet =>
        {
            optionHtml += "<option ";
            if (ruleSet.RuleSetArn == this._matchmakingConfig.RuleSetArn)
            {
                optionHtml += "selected=\"selected\" ";
            }
            optionHtml += "value=\"" + ruleSet.RuleSetName + "\">" + ruleSet.RuleSetName + "</option>";
        });

        this.element.find("#ruleSet").html(optionHtml);
    };

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

    onPopupClick = async (event) => {

        event.stopPropagation();
        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (event.target.id == "updateConfig")
        {
            let ruleSetName = this.element.find("#ruleSet").val();
            this.hideStatusAlert();
            Network.sendObject({"Type":"UpdateMatchmakingConfiguration", "RuleSetName": ruleSetName, "MatchmakingConfigName": this._matchmakingConfig.Name});
        }
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }
    };
}