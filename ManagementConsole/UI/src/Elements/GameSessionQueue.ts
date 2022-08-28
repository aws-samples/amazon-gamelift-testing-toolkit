// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import Container = Phaser.GameObjects.Container;
import BitmapText = Phaser.GameObjects.BitmapText;
import {RoundedRectangle} from "./RoundedRectangle";
import {QueueMenu} from "./Menus/QueueMenu";
import {ScreenResolution} from "../Data/ScreenResolution";

export class GameSessionQueue extends Container
{
    protected _nameText:BitmapText;
    protected _gameSessionQueue:DataTypes.GameSessionQueue;
    protected _emitter:EventDispatcher;
    protected _bg:RoundedRectangle;
    protected _over:Boolean;
    protected _queueMenu: QueueMenu;

    constructor (scene:Phaser.Scene, x:number, y:number, width:number)
    {
        super(scene, x, y);
        this._emitter = EventDispatcher.getInstance();
        this.draw(300, GameSessionQueue.queueHeight);
        this.setSize(300, GameSessionQueue.queueHeight);
        this._over=false;
    }

    public get Data():DataTypes.GameSessionQueue
    {
        return this._gameSessionQueue;
    }

    public static get queueHeight():number
    {
        if (ScreenResolution.displayResolution==ScreenResolution.RES_720P)
        {
            return 100;
        }
        else
        {
            return 150;
        }
    }

    updateQueueDimensions(width:number, height:number)
    {
        this._bg.drawRectangle(width, height);

        this._nameText.setOrigin(0.5);
        this._nameText.x = this._bg.getTopCenter().x;
        this._nameText.y = this._bg.getTopCenter().y + this._nameText.height/2;

        this._queueMenu.x = this._bg.getTopLeft().x + this._queueMenu.width/2 + 5;
        this._queueMenu.y = this._bg.getTopLeft().y + this._queueMenu.height/2 + 5;

        this.setSize(this._bg.displayWidth, this._bg.displayHeight);

        this._bg.setInteractive({ cursor: 'pointer' });
        this._bg.off("pointerdown");
        this._bg.on('pointerdown', this.handleClick);

        this._bg.on('pointerover', (pointer, localX, localY, event) =>
        {
            if (this._over==false)
            {
                this._over=true;
                this.handleOver();
            }
        });

        this._bg.on('pointerout', (pointer, localX, localY, event) =>
        {
            if (this._over==true) {
                this._over = false;
                this.handleOut();
            }
        });
    }

    draw(width:number, height:number)
    {
        this._bg?.destroy();
        this._bg = new RoundedRectangle(this.scene, 0, 0, width, height, 0x373f51).setOrigin(0);
        this.add(this._bg);

        this._nameText = this.scene.add.bitmapText(0, 0, "Noto Sans", "Queue!", 13);
        this._nameText.setOrigin(0,0);
        this.add(this._nameText);

        this._queueMenu?.destroy();
        this._queueMenu = new QueueMenu(this.scene, 0, 0, this);
        this.add(this._queueMenu);
    }

    updateQueue(queue:DataTypes.GameSessionQueue)
    {
        this._gameSessionQueue = queue;
        this._nameText.text = queue.Name;
    }

    handleClick = (pointer, localX, localY, event) =>
    {
        event.stopPropagation();

        if (this._queueMenu.menuVisible==false)
        {
            this._emitter.emit(Events.CLOSE_MENUS);
            this._emitter.emit(Events.SHOW_QUEUE_POPUP, {gameObject:this, localX:localX, localY:localY});
        }
        else
        {
            this._emitter.emit(Events.CLOSE_MENUS);
        }
    };

    handleOver()
    {
        this._emitter.emit(Events.SHOW_QUEUE_FLEETS, this);
    }

    handleOut()
    {
        this._emitter.emit(Events.HIDE_QUEUE_FLEETS, this);
    }

    getWorldTranslation()
    {
        let tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        let tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.getWorldTransformMatrix(tempMatrix, tempParentMatrix);
        var d = tempMatrix.decomposeMatrix();
        return d;
    }
}