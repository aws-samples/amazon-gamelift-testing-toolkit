// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from '../Data/DataTypes';
import {Events} from "../Events/Events";
import {EventDispatcher} from "../Events/EventDispatcher";
import Tween = Phaser.Tweens.Tween;
import Container = Phaser.GameObjects.Container;
import {RoundedRectangle} from "./RoundedRectangle";
import BitmapText = Phaser.GameObjects.BitmapText;

export class GameSession extends Container
{
    protected _gameSession:DataTypes.GameSession;
    protected _emitter:EventDispatcher;
    protected _rectangle:Phaser.GameObjects.Rectangle;
    protected _bg: RoundedRectangle;
    protected _text: BitmapText;
    protected _flashingAnim: Tween;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);

        const width = 30;
        const height = 30;

        this._bg = new RoundedRectangle(scene, 0, 0, width, height, 0x000000, 3).setOrigin(0);
        this.add(this._bg);

        this.setSize(width, height);

        this._emitter = EventDispatcher.getInstance();

        this._bg.setInteractive({ cursor: 'pointer'}).on('pointerdown', this.onTouch);

        this._text = this.scene.add.bitmapText(0, 0, "Noto Sans", "Fleet!", 13);
        this.add(this._text);

        this._flashingAnim = scene.tweens.add({
            loop:-1,
            targets: this._bg,
            alpha: 0.2,
            duration: 1000,
            yoyo:true,
            paused:true,
        });
    }

    public get Data():DataTypes.GameSession
    {
        return this._gameSession;
    }

    updateGameSession(gameSession:DataTypes.GameSession)
    {
        this._gameSession = gameSession;
        const numAvailablePlayerSessions = (gameSession.MaximumPlayerSessionCount - gameSession.CurrentPlayerSessionCount);

        if (this._gameSession.Status?.Value=="TERMINATED")
        {
            this._text.text = "0";
        }
        else
        {
            this._text.text = numAvailablePlayerSessions.toString();
        }
        this._text.x = this.width/2;
        this._text.y = this.height/2;

        if (this._gameSession.Status?.Value=="ACTIVE")
        {
            this._bg.updateColor(0x00cc00);
        }
        else
        if (numAvailablePlayerSessions==0)
        {
            this._bg.updateColor(0xcc0000);
            this.alpha=0.5;
        }

    }

    protected startFlashing()
    {
        if (!this._flashingAnim.isPlaying())
        {
            this._bg.alpha=0.75;
            this._flashingAnim.play();
        }
    }

    onTouch = (pointer, localX, localY, event)=>
    {
        event.stopPropagation();
        this._emitter.emit(Events.SHOW_GAME_SESSIONS_TABLE_POPUP, { FleetId:this.Data.FleetId, GameSession:this.Data });
    }

}