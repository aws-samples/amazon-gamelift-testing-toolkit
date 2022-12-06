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
import {SubPopups} from "../SubPopups/SubPopups";

export class FlexMatchSimulatorPopup extends Popup
{
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="flexMatchSimulatorPopup";
        this.setupEventListeners();

        this.registerSubPopup(new SimulateMatchmakingSubPopup());
        this.registerSubPopup(new PlayerProfilesSubPopup());
        this.registerSubPopup(new LatencyProfilesSubPopup());
        this.registerSubPopup(new RuleSetBuilderSubPopup());
        this.registerSubPopup(new ManageRuleSetsSubPopup());
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
        this.switchSubPopup(SubPopups.SIMULATE_MATCHMAKING_SUB_POPUP);
    }

    setupEventListeners()
    {
        super.setupEventListeners();
    }

    removeEventListeners()
    {
        super.removeEventListeners();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (el.parent().hasClass("flexMatchSimulatorMenu")) // click on left hand menu button
        {
            $('.flexMatchSimulatorMenu a').removeClass("active");
            $('.' + event.target.className).addClass("active");

            if (el.hasClass(SubPopups.PLAYER_PROFILES_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.PLAYER_PROFILES_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.LATENCY_PROFILES_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.LATENCY_PROFILES_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.SIMULATE_MATCHMAKING_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.SIMULATE_MATCHMAKING_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.RULE_SET_BUILDER_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.RULE_SET_BUILDER_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.MANAGE_RULE_SETS_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.MANAGE_RULE_SETS_SUB_POPUP);
            }
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