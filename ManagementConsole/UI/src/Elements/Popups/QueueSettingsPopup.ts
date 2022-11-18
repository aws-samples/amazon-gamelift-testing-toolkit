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

        this.registerSubPopup("queueSettings", new QueueSettingsSubPopup("assets/html/fragments/queueSettings.html", "queueSettings", this._queueData));
        this.registerSubPopup("placementPriority", new QueuePlacementPrioritySubPopup("assets/html/fragments/queuePlacementPriority.html", "placementPriority", this._queueData));
        this.registerSubPopup("destinationOrder", new QueueDestinationOrderSubPopup("assets/html/fragments/queueDestinationOrder.html", "destinationOrder", this._queueData));

        $('#queueSettingsName').html(this._queueData.Name);

        this.refresh();
    }

    refresh()
    {
        this.switchSubPopup("queueSettings");
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

        if (el.parent().hasClass("queueSettingsMenu")) // click on left hand menu button
        {
            $('.queueSettingsMenu a').removeClass("active");
            $('.' + event.target.className).addClass("active");
            $('.tab-pane').hide();

            if (el.hasClass("queueSettings"))
            {
                this.switchSubPopup("queueSettings");
            }
            else
            if (el.hasClass("placementPriority"))
            {
                this.switchSubPopup("placementPriority");
            }
            else
            if (el.hasClass("destinationOrder"))
            {
                this.switchSubPopup("destinationOrder");
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