// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Events} from "../../Events/Events";
import {SettingsForm} from "./SettingsForm";

export class LaunchPlayersForm extends SettingsForm
{
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y, "launchPlayers");
    }

    protected onClick = (event) =>
    {

        event.stopPropagation();

        switch (event.target.className)
        {
            case "backButton":
                this.hide();
                break;
        }

        if (event.target.id=="launchPlayers")
        {
            let numPlayers = this._element.getChildByID("numPlayers")["value"];
            if (numPlayers<1 || numPlayers>10)
            {
                this._element.getChildByID("errorText").className="errorText";
            }
            else
            {
                this._element.getChildByID("errorText").className="errorText hide";
                this._emitter.emit(Events.LAUNCH_PLAYERS, {numPlayers:numPlayers});
            }
        }
    }


}