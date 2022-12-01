// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import {VirtualPlayerTasksLaunchSubPopup} from "../SubPopups/VirtualPlayerTasksLaunchSubPopup";
import {VirtualPlayerTasksSchedulesSubPopup} from "../SubPopups/VirtualPlayerTasksSchedulesSubPopup";
import {VirtualPlayerTasksRunningSubPopup} from "../SubPopups/VirtualPlayerTasksRunningSubPopup";
import {VirtualPlayerLaunchRequestsSubPopup} from "../SubPopups/VirtualPlayerLaunchRequestsSubPopup";

export class VirtualPlayerTasksPopup extends Popup
{
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="virtualPlayerTasksPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.registerSubPopup("virtualPlayerTasksLaunch", new VirtualPlayerTasksLaunchSubPopup("virtualPlayerTasksLaunchSubPopup", "virtualPlayerTasksLaunch"));
        this.registerSubPopup("virtualPlayerTasksSchedules", new VirtualPlayerTasksSchedulesSubPopup("virtualPlayerTasksSchedulesSubPopup", "virtualPlayerTasksSchedules"));
        this.registerSubPopup("virtualPlayerTasksRunning", new VirtualPlayerTasksRunningSubPopup("virtualPlayerTasksRunningSubPopup", "virtualPlayerTasksRunning"));
        this.registerSubPopup("virtualPlayerTaskLaunchRequests", new VirtualPlayerLaunchRequestsSubPopup("virtualPlayerTaskLaunchRequestsSubPopup", "virtualPlayerTaskLaunchRequests"));
        this.refresh();
    }

    refresh()
    {
        this.switchSubPopup("virtualPlayerTasksLaunch");
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

        if (el.parent().hasClass("virtualPlayerTasksMenu")) // click on left hand menu button
        {
            $('.virtualPlayerTasksMenu a').removeClass("active");
            $('.' + event.target.className).addClass("active");
            $('.tab-pane').hide();

            if (el.hasClass("virtualPlayerTasksLaunch"))
            {
                this.switchSubPopup("virtualPlayerTasksLaunch");
            }
            else
            if (el.hasClass("virtualPlayerTasksSchedules"))
            {
                this.switchSubPopup("virtualPlayerTasksSchedules");
            }
            else
            if (el.hasClass("virtualPlayerTasksRunning"))
            {
                this.switchSubPopup("virtualPlayerTasksRunning");
            }
            else
            if (el.hasClass("virtualPlayerTaskLaunchRequests"))
            {
                this.switchSubPopup("virtualPlayerTaskLaunchRequests");
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