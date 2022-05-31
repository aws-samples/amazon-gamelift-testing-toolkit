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
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import {SubPopup} from "./SubPopup";

export abstract class Popup extends Phaser.GameObjects.Container
{
    protected _popup: DOMElement;
    protected _emitter: EventDispatcher;
    protected _bg: Rectangle;
    protected _htmlName:string;
    protected _html:string;
    protected _subPopups: Record<string, SubPopup>;
    protected _currentSubPopup;

    protected constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);

        this._subPopups= {};
        this._emitter = EventDispatcher.getInstance();
    }

    drawPopup()
    {
        this._popup?.destroy();
        this._popup= null;

        this._popup = this.scene.add.dom(0, 0).createFromCache(this._htmlName);
        this.add(this._popup);
        this._html = this._popup.node.outerHTML;

        this._popup.setOrigin(0.5,0.5);
        this._popup.x=0;
        this._popup.y=0;
        this._popup.setPerspective(800);
        this._popup.addListener("mousedown");
        this._popup.on('mousedown', this.onPopupClick);
        this.setVisible(false);
    }

    registerSubPopup(subPopupName:string, subPopup: SubPopup)
    {
        this._subPopups[subPopupName] = subPopup;
    }

    switchSubPopup(subPopupName:string)
    {
        this._currentSubPopup?.removeEventListeners();
        this._subPopups[subPopupName].setupEventListeners();
        this._subPopups[subPopupName].loadContent();
        this._currentSubPopup = this._subPopups[subPopupName];
    }

    drawComplete()
    {

    }

    show(event:PopupClickEvent)
    {
        console.log("SHOWING POPUP", this, event);
        this.drawPopup();

        this.setPopupData(event);
        this._popup.x = config.width/2;
        this._popup.y = config.height/2;

        this.setVisible(true);
        this.drawComplete();
    }

    abstract setPopupData(data:PopupClickEvent):void


    hide()
    {
        this.x=0;
        this.setVisible(false);
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target.className);
        switch (event.target.className) {
            case "closeButton":
                this._emitter.emit(Events.CLOSE_POPUP);
                this.setVisible(false);
                break;
        }
    }

    onBgClick = async ()=>
    {
        this.setVisible(false);
    }

    removeEventListeners()
    {

    }

    public destroy() {
        console.log("DESTROYING POPUP!");
        this.removeEventListeners();
        super.destroy();
    }
}