// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";

export class PurgeDataPopup extends Popup
{
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="purgeDataPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
    }

    setupEventListeners()
    {
        super.setupEventListeners();
        this._emitter.on(Events.PURGE_DATA_RESPONSE, this.onPurgeDataResponse);
        this._emitter.on(Events.PURGE_DATA_PROGRESS_RESPONSE, this.onPurgeDataProgressResponse);
    }

    removeEventListeners()
    {
        super.removeEventListeners();
        this._emitter.off(Events.PURGE_DATA_RESPONSE, this.onPurgeDataResponse);
        this._emitter.off(Events.PURGE_DATA_PROGRESS_RESPONSE, this.onPurgeDataProgressResponse);
    }

    onPurgeDataResponse = (data) =>
    {
        if (data.Completed)
        {
            $("button.purgeData").prop("disabled", false);
            this.setPurgeProgressText("Purge Complete. " + data.ItemsPurged + " database items purged");
        }
    }

    onPurgeDataProgressResponse = (data) =>
    {
        this.setPurgeProgressText(data.ItemsPurged + " database items purged");
    }

    setPurgeProgressText(html)
    {
        $('.purgeDataProgressText').html(html);
    }

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
        const el = $(event.target);

        if (el.hasClass("closeButton")) {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        if (el.hasClass("purgeData"))
        {
            $("button.purgeData").prop("disabled", true);
            let purgeFlexMatch = (this.element.find("#purgeFlexMatch")[0] as HTMLInputElement).checked;
            let purgeGameSessions = (this.element.find("#purgeGameSessions")[0] as HTMLInputElement).checked;
            Network.sendObject({ Type:"PurgeData", PurgeMatchmakingData:purgeFlexMatch, PurgeGameSessionsData: purgeGameSessions });
        }
    };
}