// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import {SimpleButton} from "./SimpleButton";
import DOMElement = Phaser.GameObjects.DOMElement;

export abstract class SimpleMenu extends Phaser.GameObjects.Container
{
    protected _globalEmitter: EventDispatcher;
    public menuEmitter: EventDispatcher;
    protected _button: SimpleButton;
    protected _menuOptions:any;
    public menuVisible=false;
    protected _element:DOMElement;
    protected abstract _html:string;

    protected constructor(scene:Phaser.Scene, x:number, y:number) {
        super(scene, x, y);
        this._globalEmitter = EventDispatcher.getInstance();
        this.menuEmitter = new EventDispatcher();
    }

    public get button()
    {
        return this._button;
    }

    public setButton(button:SimpleButton)
    {
        this._button = button;
        this.add(this._button);
    }

    enable()
    {
        this._button.enable();
    }


    disable()
    {
        this._button.disable();
    }

    showMenu(align:string = "left", x:number=0, y:number=0)
    {
        this.menuVisible=true;
        this._element?.destroy();

        this._element = this.scene.add.dom(0, 0).createFromHTML(this._html);
        this._element.setOrigin(0);
        this.add(this._element);

        this._element.updateSize();

        if (align=="left")
        {
            this._element.x -= Math.round(this._button.displayWidth/2);
        }
        else
        {
            this._element.setOrigin(1,0);
            this._element.x = 0;
        }

        this._element.y -= Math.round(this._button.displayHeight/2);
        this._element.x += x;
        this._element.y += y;
        this._element.setInteractive();
        this._element.addListener("mousedown");
        this._element.on('mousedown', this.onMenuOptionClick);

        this.buildMenu();

        this._element.alpha=0;
        this.scene.tweens.add({
            targets: this._element,
            alpha: 1,
            duration: 1000,
            ease: 'Power3'
        });

    }

    protected abstract buildMenu():void;

    onMenuOptionClick = async (event) => {
        event.stopPropagation();
        this.handleClick(event.target.className);
    };

    public abstract handleClick(className:string):void;

    public onMenuButtonClick ()
    {
        this._globalEmitter.emit(Events.SCENE_CLICKED);
        this._globalEmitter.emit(Events.CLOSE_POPUP);
        this.showMenu();
    }

    hideMenu()
    {
        this._element?.destroy();
        this.menuVisible=false;
    }

}