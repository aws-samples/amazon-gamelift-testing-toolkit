// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {Instance} from "./Instance";
import Text = Phaser.GameObjects.Text;
import Group = Phaser.GameObjects.Group;
import {BaseContainer} from "./Abstract/BaseContainer";
import Rectangle = Phaser.GameObjects.Rectangle;
import GameSession = DataTypes.GameSession;
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import Container = Phaser.GameObjects.Container;
import BitmapText = Phaser.GameObjects.BitmapText;
import {RoundedRectangle} from "./RoundedRectangle";
import {QueueMenu} from "./Menus/QueueMenu";
import {MatchmakingConfigMenu} from "./Menus/MatchmakingConfigMenu";
import {ScreenResolution} from "../Data/ScreenResolution";

export class MatchmakingConfig extends Container
{
    protected _nameText:BitmapText;
    protected _matchmakingConfig:DataTypes.MatchmakingConfiguration;
    protected _emitter:EventDispatcher;
    protected _bg:RoundedRectangle;
    protected _over:boolean;
    protected _mmConfigMenu: MatchmakingConfigMenu;

    constructor (scene:Phaser.Scene, x:number, y:number, width:number)
    {
        super(scene, x, y);
        this._emitter = EventDispatcher.getInstance();
        this.draw(300, MatchmakingConfig.configHeight);
        this.setSize(300, MatchmakingConfig.configHeight);
        this._over=false;
    }

    public static get configHeight():number
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

    public get Data():DataTypes.MatchmakingConfiguration
    {
        return this._matchmakingConfig;
    }

    updateConfigDimensions(width:number, height:number)
    {
        this._bg.drawRectangle(width, height);

        this._nameText.setOrigin(0.5);
        this._nameText.x = this._bg.getTopCenter().x;
        this._nameText.y = this._bg.getTopCenter().y + this._nameText.height/2;

        this._mmConfigMenu.x = this._bg.getTopLeft().x + this._mmConfigMenu.width/2 + 5;
        this._mmConfigMenu.y = this._bg.getTopLeft().y + this._mmConfigMenu.height/2 + 5;

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

        this._mmConfigMenu?.destroy();
        this._mmConfigMenu = new MatchmakingConfigMenu(this.scene, 0, 0, this);
        this.add(this._mmConfigMenu);
    }

    getWorldTranslation()
    {
        let tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        let tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.getWorldTransformMatrix(tempMatrix, tempParentMatrix);
        var d = tempMatrix.decomposeMatrix();
        return d;
    }

    handleClick = (pointer, localX, localY, event) =>
    {
        event.stopPropagation();

        if (this._mmConfigMenu.menuVisible==false)
        {
            this._emitter.emit(Events.CLOSE_MENUS);
            this._emitter.emit(Events.SHOW_MATCHMAKING_CONFIG_POPUP, {gameObject:this, localX:localX, localY:localY});
        }
        else
        {
            this._emitter.emit(Events.CLOSE_MENUS);
        }
    };

    handleOver()
    {
        this._emitter.emit(Events.SHOW_MATCHMAKING_CONFIG_QUEUES, this);
    }

    handleOut()
    {
        this._emitter.emit(Events.HIDE_MATCHMAKING_CONFIG_QUEUES, this);
    }

    updateConfig(config:DataTypes.MatchmakingConfiguration)
    {
        this._matchmakingConfig = config;
        this._nameText.text = config.Name;
    }
}