// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {SimpleMenu} from "../Abstract/SimpleMenu";
import {Events} from "../../Events/Events";
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import {MatchmakingConfig} from "../MatchmakingConfig";
import {MatchmakingConfigMenuButton} from "../Buttons/MatchmakingConfigMenuButton";

export class MatchmakingConfigMenu extends SimpleMenu {

    protected _mmConfig:MatchmakingConfig;
    protected _html:string = '<div class="queueMenu"></div>';

    constructor(scene:Phaser.Scene, x:number, y:number, mmConfig:MatchmakingConfig) {
        super(scene, x, y);

        this._mmConfig = mmConfig;
        let button = new MatchmakingConfigMenuButton(scene, 0, 0);
        button.scale=0.35
        this.setButton(button);
        this.setSize(button.displayWidth, button.displayHeight);

        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this._button.buttonEmitter.on(Events.CLICK, this.onMenuButtonClick);
        this.hideMenu = this.hideMenu.bind(this);

        this._globalEmitter.on(Events.CLOSE_MENUS, this.hideMenu);

        this.handleClick = this.handleClick.bind(this);
    }

    buildMenu()
    {
        this._menuOptions = [
            {
                text: "View Tickets",
                triggerEvent: Events.SHOW_MATCHMAKING_TICKETS_POPUP,
            },
            {
                text: "Modify Config",
                triggerEvent: Events.SHOW_MODIFY_MATCHMAKING_CONFIGURATION_POPUP,
            },
            {
                text: "View Metrics",
                triggerEvent: Events.SHOW_MATCHMAKING_GRAPH_POPUP,
            },
        ];

        this._menuOptions.map((option)=>
        {
            let a = document.createElement('a');
            a.className=option.triggerEvent;
            a.text=option.text;
            a.href="#";
            this._element.node.querySelector(".queueMenu").append(a);
        })
    }

    handleClick(className: string) {
        switch (className)
        {
            case Events.SHOW_MATCHMAKING_TICKETS_POPUP:
                this._globalEmitter.emit(className, new PopupClickEvent(this._mmConfig));
                break;
            case Events.SHOW_MODIFY_MATCHMAKING_CONFIGURATION_POPUP:
                this._globalEmitter.emit(className, new PopupClickEvent(this._mmConfig));
                break;
            case Events.SHOW_MATCHMAKING_GRAPH_POPUP:
                this._globalEmitter.emit(className, new PopupClickEvent(this._mmConfig));
                break;
            default:
                this.menuEmitter.emit(className, this._mmConfig);
                break;
        }

        this.hideMenu();
    }
}