// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {SimpleMenu} from "../Abstract/SimpleMenu";
import {SettingsButton} from "../Buttons/SettingsButton";
import {FleetLocationButton} from "../Buttons/FleetLocationButton";
import {Events} from "../../Events/Events";
import {Fleet} from "../Fleet";
import {PopupClickEvent} from "../../Events/PopupClickEvent";

export class LocationPopover extends SimpleMenu {

    protected _fleet:Fleet;
    protected _html:string = '<div class="locationPopover"></div>';

    constructor(scene:Phaser.Scene, x:number, y:number, fleet:Fleet) {
        super(scene, x, y);

        this._fleet = fleet;
        let button = new FleetLocationButton(scene, 0, 0);
        button.scale=0.35
        this.setButton(button);
        this.setSize(button.displayWidth, button.displayHeight);

        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        //this._globalEmitter.on(Events.OPEN_FLEET_MENU, this.onMenuButtonClick);
        this.showPopover = this.showPopover.bind(this);
        this.hideMenu = this.hideMenu.bind(this);
        this._button.buttonEmitter.on(Events.OVER, this.showPopover);
        this._button.buttonEmitter.on(Events.OUT, this.hideMenu);


        this._globalEmitter.on(Events.CLOSE_MENUS, this.hideMenu);

        this.handleClick = this.handleClick.bind(this);

        console.log("CREATING FLEET MENU");

        console.log(this._menuOptions);
    }

    showPopover()
    {
        this.showMenu("right");
    }

    buildMenu()
    {
        const locations=[];
        this._fleet.Data.LocationAttributes.map((locationAttribute)=>
        {
            locations.push(locationAttribute.LocationState.Location + " (" + locationAttribute.LocationState.Status.Value + ")");
        })
        let p = document.createElement('p');
        p.className="mb-0"
        p.innerHTML=locations.join("<br/>");
        this._element.node.querySelector(".locationPopover").append(p);
    }

    handleClick(className: string) {
        switch (className)
        {
            default:
                this.menuEmitter.emit(className, this._fleet);
                break;
        }

        this.hideMenu();
    }
}