// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Image = Phaser.GameObjects.Image;
import EventEmitter = Phaser.Events.EventEmitter;

export abstract class SimpleButton extends Phaser.GameObjects.Container
{
    protected _globalEmitter: EventDispatcher;
    protected _buttonEmitter: EventEmitter;
    public _buttonImage: Image;
    protected _over:boolean;

    constructor(scene:Phaser.Scene, x:number, y:number, texture:string) {
        super(scene, x, y);
        this._globalEmitter = EventDispatcher.getInstance();
        this._buttonImage = this.scene.add.sprite(0,0, "toolkit", texture);
        this._buttonImage.setOrigin(0.5, 0.5);
        this.add(this._buttonImage);
        this.setSize(this._buttonImage.displayWidth, this._buttonImage.displayHeight);
        this.onClick = this.onClick.bind(this);
        this.onOver = this.onOver.bind(this);
        this.onOut = this.onOut.bind(this);
        this._buttonImage.setInteractive({ cursor: 'pointer' }).on('pointerdown', this.onClick);
        this._buttonImage.setInteractive({ cursor: 'pointer' }).on('pointerover', this.onOver);
        this._buttonImage.setInteractive({ cursor: 'pointer' }).on('pointerout', this.onOut);
        this._buttonEmitter = new EventEmitter();
        this._over=false;
    }

    public get buttonEmitter():EventEmitter
    {
        return this._buttonEmitter;
    }

    public enable()
    {
        this._buttonImage.input.enabled=true;
    }

    public disable()
    {
        this._buttonImage.input.enabled=false;
    }

    public onClick (pointer, localX, localY, event)
    {
        event.stopPropagation();
        this._globalEmitter.emit(Events.CLOSE_MENUS);
        this._buttonEmitter.emit(Events.CLICK);
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