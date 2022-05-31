// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {SimpleMenu} from "../Abstract/SimpleMenu";
import {SettingsButton} from "../Buttons/SettingsButton";
import {FleetMenuButton} from "../Buttons/FleetMenuButton";
import {Events} from "../../Events/Events";
import {Fleet} from "../Fleet";
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import {GameSessionQueue} from "../GameSessionQueue";
import {QueueMenuButton} from "../Buttons/QueueMenuButton";

export class QueueMenu extends SimpleMenu {

    protected _queue:GameSessionQueue;
    protected _html:string = '<div class="queueMenu"></div>';

    constructor(scene:Phaser.Scene, x:number, y:number, queue:GameSessionQueue) {
        super(scene, x, y);

        this._queue = queue;
        let button = new QueueMenuButton(scene, 0, 0);
        button.scale=0.35
        this.setButton(button);
        this.setSize(button.displayWidth, button.displayHeight);

        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        //this._globalEmitter.on(Events.OPEN_FLEET_MENU, this.onMenuButtonClick);
        this._button.buttonEmitter.on(Events.CLICK, this.onMenuButtonClick);
        this.hideMenu = this.hideMenu.bind(this);

        this._globalEmitter.on(Events.CLOSE_MENUS, this.hideMenu);

        this.handleClick = this.handleClick.bind(this);
    }

    buildMenu()
    {
        this._menuOptions = [
            {
                text: "View Queue Events",
                triggerEvent: Events.SHOW_QUEUE_EVENTS_POPUP,
            },
            {
                text: "View Metrics",
                triggerEvent: Events.SHOW_QUEUE_GRAPH_POPUP,
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
            case Events.SHOW_QUEUE_EVENTS_POPUP:
                this._globalEmitter.emit(className, new PopupClickEvent(this._queue));
                break;
            case Events.SHOW_QUEUE_GRAPH_POPUP:
                this._globalEmitter.emit(className, new PopupClickEvent(this._queue));
                break;
            default:
                this.menuEmitter.emit(className, this._queue);
                break;
        }

        this.hideMenu();
    }
}