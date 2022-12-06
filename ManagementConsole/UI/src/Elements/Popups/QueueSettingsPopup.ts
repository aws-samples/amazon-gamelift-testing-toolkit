// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import {QueueSettingsSubPopup} from "../SubPopups/QueueSettingsSubPopup";
import {QueuePlacementPrioritySubPopup} from "../SubPopups/QueuePlacementPrioritySubPopup";
import {QueueDestinationOrderSubPopup} from "../SubPopups/QueueDestinationOrderSubPopup";
import {DataTypes} from "../../Data/DataTypes";
import GameSessionQueue = DataTypes.GameSessionQueue;
import {SubPopups} from "../SubPopups/SubPopups";

export class QueueSettingsPopup extends Popup
{
    protected _queueData: GameSessionQueue;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="queueSettingsPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this._queueData = data.gameObject.Data as GameSessionQueue;

        this.registerSubPopup(new QueueSettingsSubPopup(this._queueData));
        this.registerSubPopup(new QueuePlacementPrioritySubPopup(this._queueData));
        this.registerSubPopup(new QueueDestinationOrderSubPopup(this._queueData));

        $('#queueSettingsName').html(this._queueData.Name);

        this.refresh();
    }

    refresh()
    {
        this.switchSubPopup(SubPopups.QUEUE_SETTINGS_SUB_POPUP);
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

        if (el.parent().hasClass("queueSettingsMenu")) // click on left hand menu button
        {
            $('.queueSettingsMenu a').removeClass("active");
            $('.' + event.target.className).addClass("active");

            if (el.hasClass(SubPopups.QUEUE_SETTINGS_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.QUEUE_SETTINGS_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.QUEUE_PLACEMENT_PRIORITY_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.QUEUE_PLACEMENT_PRIORITY_SUB_POPUP);
            }
            else
            if (el.hasClass(SubPopups.QUEUE_DESTINATION_ORDER_SUB_POPUP))
            {
                this.switchSubPopup(SubPopups.QUEUE_DESTINATION_ORDER_SUB_POPUP);
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