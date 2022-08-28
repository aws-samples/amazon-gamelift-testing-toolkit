// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import {PopupClickEvent} from "./../Events/PopupClickEvent";
import {ConsoleScene} from "../Scenes/ConsoleScene";

export class PlayerSprite extends Phaser.GameObjects.Sprite
{
    public added:boolean = false;
    public _emitter:EventDispatcher;

    constructor (scene:Phaser.Scene, x:number, y:number, texture:string)
    {
        super(scene, x, y, texture);

        this._emitter = new EventDispatcher();

        this.setOrigin(0.5, 0.5);
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 0, 4, 8] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 1, 5, 9] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 2, 6, 10] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 3, 7, 11] }),
            frameRate: 8,
            repeat: -1
        });

        this.setInteractive().on("pointerdown", this.onMouseDown);
        this.setInteractive().on("pointerover", this.onMouseOver);

        if (ConsoleScene.animationsEnabled==false)
        {
            this.visible=false;
        }

    }

    public addedToScene() {
        super.addedToScene();
        this.added=true;
    }

    public onMouseDown = (pointer, localX, localY, event)=>
    {
        this._emitter.emit(Events.SHOW_PLAYER_POPUP, new PopupClickEvent(this, localX, localY));
    }

    public onMouseOver = (pointer, localX, localY, event)=>
    {
        this._emitter.emit(Events.OVER_PLAYER);
    }

    public static Random(scene) : PlayerSprite
    {
        let rnd = Math.ceil(Math.random()*16);
        return new PlayerSprite(scene, 0, 0, "char"+rnd);
    }
}