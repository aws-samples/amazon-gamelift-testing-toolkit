// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from '../Data/DataTypes';
import {Events} from "../Events/Events";
import {EventDispatcher} from "../Events/EventDispatcher";
import Tween = Phaser.Tweens.Tween;
import Container = Phaser.GameObjects.Container;
import {ConsoleScene} from "../Scenes/ConsoleScene";

export class Instance extends Container
{
    protected _instance:DataTypes.Instance;
    protected _emitter:EventDispatcher;
    protected _image:Phaser.GameObjects.Sprite;
    protected _flashingAnim: Tween;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);

        this._image = this.scene.add.sprite(0,0, "toolkit", "instance.png");
        this._image.setOrigin(0);

        this._emitter = EventDispatcher.getInstance();

        this.scale=0.2;
        this.setSize(this._image.displayWidth, this._image.displayHeight);
        this.add(this._image);
        this._image.setInteractive({ cursor: 'pointer' }).on('pointerdown', this.onTouch);

        this._flashingAnim = scene.tweens.add({
            loop:-1,
            targets: this._image,
            alpha: {
                getStart: () => 0.4,
                getEnd: () => 0.75,
            },
            duration: 1000,
            yoyo:true,
        });

    }

    public get Data():DataTypes.Instance
    {
        return this._instance;
    }

    protected startFlashing()
    {
        if (!this._flashingAnim.isPlaying())
        {
            setTimeout(()=>
            {
                this._image.alpha=1;
                this._flashingAnim.play();
            }, 1000);
        }
    }

    updateInstance(instance:DataTypes.Instance)
    {
        this._instance = instance;
        switch (this._instance.Status?.Value)
        {
            case "PENDING":
            case "Activating":
            case "PendingAuxProxyRegistration":
                this._image.tint = 0x00cc00;
                this._image.alpha=0.75;
                this.startFlashing();
                break;

            case "TERMINATING":
                this._image.tint = 0xcc0000;
                this._image.alpha=0.75;
                this.startFlashing();
                break;

            default:
                this._flashingAnim.stop(0);
                this._image.clearTint();
                this._image.clearAlpha();
        }

        this.visible = ConsoleScene.animationsEnabled;
    }

    onTouch = (pointer, localX, localY, event)=>
    {
        event.stopPropagation();
        this._emitter.emit(Events.SHOW_INSTANCE_POPUP, {gameObject:this, localX:localX, localY:localY});
    }

}