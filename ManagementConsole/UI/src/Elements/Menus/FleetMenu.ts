// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {SimpleMenu} from "../Abstract/SimpleMenu";
import {FleetMenuButton} from "../Buttons/FleetMenuButton";
import {Events} from "../../Events/Events";
import {Fleet} from "../Fleet";
import {PopupClickEvent} from "../../Events/PopupClickEvent";

export class FleetMenu extends SimpleMenu {

    protected _fleet:Fleet;
    protected _html:string = '<div class="fleetMenu"></div>';

    constructor(scene:Phaser.Scene, x:number, y:number, fleet:Fleet) {
        super(scene, x, y);

        this._fleet = fleet;
        let button = new FleetMenuButton(scene, 0, 0);
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
                text: "View Fleet Events",
                triggerEvent: Events.SHOW_FLEET_EVENTS_POPUP,
            },
            {
                text: "View Metrics",
                triggerEvent: Events.SHOW_FLEET_GRAPH_POPUP,
            },
            {
                text: "View Game Sessions Log",
                triggerEvent: Events.SHOW_GAME_SESSIONS_TABLE_POPUP,
            },
            {
                text: "Modify Locations",
                triggerEvent: Events.SHOW_FLEET_LOCATIONS_POPUP,
            },
            {
                text: "Adjust Scaling",
                triggerEvent: Events.SHOW_FLEET_SCALING_POPUP,
            },
        ];

        this._menuOptions.map((option)=>
        {
            let a = document.createElement('a');
            a.className=option.triggerEvent;
            a.text=option.text;
            a.href="#";
            this._element.node.querySelector(".fleetMenu").append(a);
        })
    }

    handleClick(className: string) {
        switch (className)
        {
            case Events.SHOW_FLEET_SCALING_POPUP:
            case Events.SHOW_FLEET_EVENTS_POPUP:
            case Events.SHOW_FLEET_LOCATIONS_POPUP:
            case Events.SHOW_FLEET_GRAPH_POPUP:
                this._globalEmitter.emit(className, new PopupClickEvent(this._fleet));
                break;
            case Events.SHOW_GAME_SESSIONS_TABLE_POPUP:
                this._globalEmitter.emit(className, {FleetId:this._fleet.Data.FleetId});
                break;
            default:
                this.menuEmitter.emit(className, this._fleet);
                break;
        }

        this.hideMenu();
    }
}