// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import {VirtualPlayerTasksLaunchSubPopup} from "../SubPopups/VirtualPlayerTasksLaunchSubPopup";
import {VirtualPlayerTasksSchedulesSubPopup} from "../SubPopups/VirtualPlayerTasksSchedulesSubPopup";
import {VirtualPlayerTasksRunningSubPopup} from "../SubPopups/VirtualPlayerTasksRunningSubPopup";
import {VirtualPlayerLaunchRequestsSubPopup} from "../SubPopups/VirtualPlayerLaunchRequestsSubPopup";
import {VirtualPlayerTasksOverviewSubPopup} from "../SubPopups/VirtualPlayerTasksOverviewSubPopup";
import {SubPopups} from "../SubPopups/SubPopups";

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
        this.registerSubPopup(new VirtualPlayerTasksOverviewSubPopup());
        this.registerSubPopup(new VirtualPlayerTasksLaunchSubPopup());
        this.registerSubPopup(new VirtualPlayerTasksSchedulesSubPopup());
        this.registerSubPopup(new VirtualPlayerTasksRunningSubPopup());
        this.registerSubPopup(new VirtualPlayerLaunchRequestsSubPopup());
        this.refresh();
    }

    refresh()
    {
        this.switchSubPopup(SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP);
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (el.parent().hasClass("virtualPlayerTasksMenu")) // click on left hand menu button
        {
            $('.virtualPlayerTasksMenu a').removeClass("active");
            $('.' + event.target.className).addClass("active");

            if (el.hasClass(SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.VIRTUAL_PLAYER_TASKS_LAUNCH_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.VIRTUAL_PLAYER_TASKS_LAUNCH_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.VIRTUAL_PLAYER_TASKS_SCHEDULES_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.VIRTUAL_PLAYER_TASKS_SCHEDULES_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.VIRTUAL_PLAYER_TASKS_RUNNING_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.VIRTUAL_PLAYER_TASKS_RUNNING_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.VIRTUAL_PLAYER_TASKS_LAUNCH_REQUESTS_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.VIRTUAL_PLAYER_TASKS_LAUNCH_REQUESTS_SUB_POPUP);
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