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

export class GameSessionPopup extends Popup
{
    protected _gameSessionData:GameSession;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="gameSessionPopup";
    }

    setPopupData(data:any)
    {
        console.log(data);
        if (data.showBack == false)
        {
            this._popup.getChildByID("backButton").className="btn btn-primary btn-sm hide";
        }
        else
        {
            this._popup.getChildByID("backButton").className="btn btn-primary btn-sm";
        }
        this._gameSessionData = data.data as GameSession;

        this._popup.getChildByID("gameSessionId").innerHTML=this._gameSessionData.GameSessionId;
        this._popup.getChildByID("ipAddress").innerHTML=this._gameSessionData.IpAddress;
        this._popup.getChildByID("dnsName").innerHTML=this._gameSessionData.DnsName;
        this._popup.getChildByID("region").innerHTML=this._gameSessionData.Location;
        this._popup.getChildByID("currentPlayerSessions").innerHTML=this._gameSessionData.CurrentPlayerSessionCount + "/" + this._gameSessionData.MaximumPlayerSessionCount;
        this._popup.getChildByID("instanceStatus").innerHTML=this._gameSessionData.Status.Value;
        this._popup.getChildByID("creationDate").innerHTML=new Date(this._gameSessionData.CreationTime).toISOString();
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else
        {
            if (event.target.id=="backButton")
            {
                this._emitter.emit(Events.SHOW_GAME_SESSIONS_TABLE_POPUP, {FleetId: this._gameSessionData.FleetId});
            }
        }
    }

}