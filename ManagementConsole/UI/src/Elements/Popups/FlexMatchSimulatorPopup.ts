// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import {SimulateMatchmakingSubPopup} from "../SubPopups/SimulateMatchmakingSubPopup";
import {ManageRuleSetsSubPopup} from "../SubPopups/ManageRuleSetsSubPopup";
import {PlayerProfilesSubPopup} from "../SubPopups/PlayerProfilesSubPopup";
import {RuleSetBuilderSubPopup} from "../SubPopups/RuleSetBuilderSubPopup";
import {LatencyProfilesSubPopup} from "../SubPopups/LatencyProfilesSubPopup";

export class FlexMatchSimulatorPopup extends Popup
{
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="flexMatchSimulatorPopup";
        this.setupEventListeners();

        this.registerSubPopup("simulateMatchmaking", new SimulateMatchmakingSubPopup("simulateMatchmakingSubPopup", "simulateMatchmaking"));
        this.registerSubPopup("configurePlayerProfiles", new PlayerProfilesSubPopup("playerProfilesSubPopup", "playerProfiles"));
        this.registerSubPopup("configureLatencyProfiles", new LatencyProfilesSubPopup("latencyProfilesSubPopup", "latencyProfiles"));
        //this.registerSubPopup("ruleSetBuilder", new RuleSetBuilderSubPopup("ruleSetBuilderSubPopup", "ruleSetBuilder"));
        this.registerSubPopup("ruleSetBuilder", new RuleSetBuilderSubPopup("ruleSetBuilderSubPopup", "ruleSetBuilder"));
        this.registerSubPopup("manageRuleSets", new ManageRuleSetsSubPopup("ruleSetsSubPopup", "ruleSets"));
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
        this.switchSubPopup("simulateMatchmaking");
    }


    setupEventListeners()
    {
    }

    removeEventListeners()
    {
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (el.parent().hasClass("flexMatchSimulatorMenu")) // click on left hand menu button
        {
            $('.flexMatchSimulatorMenu a').removeClass("active");
            $('.' + event.target.className).addClass("active");
            $('.tab-pane').hide();

            if (el.hasClass("configurePlayerProfiles"))
            {
                this.switchSubPopup("configurePlayerProfiles");
            }
            else
            if (el.hasClass("configureLatencyProfiles"))
            {
                this.switchSubPopup("configureLatencyProfiles");
            }
            else
            if (el.hasClass("simulateMatchmaking"))
            {
                this.switchSubPopup("simulateMatchmaking");
            }
            else
            if (el.hasClass("ruleSetBuilder"))
            {
                this.switchSubPopup("ruleSetBuilder");
            }
            else
            if (el.hasClass("ruleSets"))
            {
                this.switchSubPopup("manageRuleSets");
            }
            $(el.attr("data-tab")).show();
        }
        else
        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        {
            this._currentSubPopup.onPopupClick(event);
        }
    }
}