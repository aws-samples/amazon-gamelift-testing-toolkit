// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Image = Phaser.GameObjects.Image;
import EventEmitter = Phaser.Events.EventEmitter;

export abstract class ToggleButton extends Phaser.GameObjects.Container
{
    protected _globalEmitter: EventDispatcher;
    protected _buttonEmitter: EventEmitter;
    protected _buttonImage1: Image;
    protected _buttonImage2: Image;
    protected _toggled:boolean = false;
    protected _over:boolean;

    constructor(scene:Phaser.Scene, x:number, y:number, texture1:string, texture2:string, toggled:boolean) {
        super(scene, x, y);
        this._globalEmitter = EventDispatcher.getInstance();
        this._buttonImage1 = this.scene.add.sprite(0,0, "toolkit", texture1);
        this._buttonImage1.setOrigin(0.5, 0.5);
        this._buttonImage2 = this.scene.add.sprite(0,0, "toolkit", texture2);
        this._buttonImage2.setOrigin(0.5, 0.5);
        this._toggled=toggled;

        this.add(this._buttonImage1);
        this.add(this._buttonImage2);
        this.setSize(this._buttonImage1.displayWidth, this._buttonImage1.displayHeight);
        this.onClick = this.onClick.bind(this);
        this.onOver = this.onOver.bind(this);
        this.onOut = this.onOut.bind(this);

        this._buttonEmitter = new EventEmitter();
        this._over=false;
        this.updateButton();
    }

    public toggleButton()
    {
        this._toggled = !this._toggled;
        this.updateButton();
        this._buttonEmitter.emit(Events.CLICK, this._toggled);
    }

    public updateButton()
    {
        if (!this._toggled)
        {
            this._buttonImage1.setInteractive({ cursor: 'pointer' }).on('pointerdown', this.onClick);
            this._buttonImage1.setInteractive({ cursor: 'pointer' }).on('pointerover', this.onOver);
            this._buttonImage1.setInteractive({ cursor: 'pointer' }).on('pointerout', this.onOut);
            this._buttonImage2.setInteractive({ cursor: 'pointer' }).off('pointerdown', this.onClick);
            this._buttonImage2.setInteractive({ cursor: 'pointer' }).off('pointerover', this.onOver);
            this._buttonImage2.setInteractive({ cursor: 'pointer' }).off('pointerout', this.onOut);
            this._buttonImage1.visible=true;
            this._buttonImage2.visible=false;
        }
        else
        {
            this._buttonImage1.setInteractive({ cursor: 'pointer' }).off('pointerdown', this.onClick);
            this._buttonImage1.setInteractive({ cursor: 'pointer' }).off('pointerover', this.onOver);
            this._buttonImage1.setInteractive({ cursor: 'pointer' }).off('pointerout', this.onOut);
            this._buttonImage2.setInteractive({ cursor: 'pointer' }).on('pointerdown', this.onClick);
            this._buttonImage2.setInteractive({ cursor: 'pointer' }).on('pointerover', this.onOver);
            this._buttonImage2.setInteractive({ cursor: 'pointer' }).on('pointerout', this.onOut);
            this._buttonImage1.visible=false;
            this._buttonImage2.visible=true;
        }
    }

    public get buttonEmitter():EventEmitter
    {
        return this._buttonEmitter;
    }

    public enable()
    {
        this._buttonImage1.input.enabled=true;
        this._buttonImage2.input.enabled=true;
    }

    public disable()
    {
        this._buttonImage1.input.enabled=false;
        this._buttonImage2.input.enabled=false;
    }

    public onClick (pointer, localX, localY, event)
    {
        event.stopPropagation();
        this.toggleButton();

    }

    public onOver(pointer, localX, localY, event)
    {
        if (this._over==false)
        {
            this._over=true;
            this._buttonEmitter.emit(Events.OVER);
        }
    }

    public onOut(pointer, localX, localY, event)
    {
        this._over=false;
        this._buttonEmitter.emit(Events.OUT);
    }


}