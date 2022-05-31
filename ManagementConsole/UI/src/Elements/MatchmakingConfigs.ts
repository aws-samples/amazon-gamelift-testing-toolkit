// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {MatchmakingConfig} from "./MatchmakingConfig";
import config from "../Config/Config";
import Rectangle = Phaser.GameObjects.Rectangle;
import {Instance} from "./Instance";
import Group = Phaser.GameObjects.Group;
import {BaseContainer} from "./Abstract/BaseContainer";
import Image = Phaser.GameObjects.Image;
import BitmapText = Phaser.GameObjects.BitmapText;
import {RoundedRectangle} from "./RoundedRectangle";

export class MatchmakingConfigs extends BaseContainer
{
    protected _matchmakingConfigs : Record<string, MatchmakingConfig>;
    protected _layoutRows=1;
    protected _titleText:BitmapText;
    protected _groupOffsetY=30;

    constructor (scene:Phaser.Scene, x:number, y:number, width:number, height:number)
    {
        super(scene, x, y);
        this._matchmakingConfigs = {};

        let dottedLineTexture = this.getDottedLineTexture("configsLine");
        let img = new Image(scene, 0, 0, dottedLineTexture).setOrigin(0);
//        img.setOrigin(0,0);
        this.add(img);

        this._titleText = this.scene.add.bitmapText(5, 3, "Noto Sans", "Matchmaking Configurations", 16);
        this._titleText.setOrigin(0,0);
        this.add(this._titleText);

        this._bg = new RoundedRectangle(scene, 0, this._groupOffsetY, width, height-this._groupOffsetY, 0x00cc00).setOrigin(0);
        this.add(this._bg);
        this._bg.alpha=0;
        this.setSize(width, height);
    }

    public handleClick(localX, localY)
    {

    }

    public getConfigByArn(arn:string):MatchmakingConfig
    {
        let foundMatchmakingConfig=null;
        Object.keys(this._matchmakingConfigs).map((configName:string)=>
        {
            if (this._matchmakingConfigs[configName].Data.ConfigurationArn == arn)
            {
                foundMatchmakingConfig = this._matchmakingConfigs[configName];
            }
        });

        return foundMatchmakingConfig;
    }

    public get ChildElements():MatchmakingConfig[]
    {
        return Object.values(this._matchmakingConfigs);
    }

    public updateConfig(mmConfig:DataTypes.MatchmakingConfiguration)
    {
        if (this._matchmakingConfigs[mmConfig.Name]==undefined)
        {
            this._matchmakingConfigs[mmConfig.Name] = new MatchmakingConfig(this.scene, 0, 0, 20, this.displayHeight);
            this.addConfig(mmConfig.Name);
        }

        this._matchmakingConfigs[mmConfig.Name].updateConfig(mmConfig);

        this.updateConfigDimensions();
    }

    public addConfig(id:string, fake:boolean=false)
    {
        this._matchmakingConfigs[id] = new MatchmakingConfig(this.scene, this._bg.x + this._bg.width/2, this._bg.y + this._bg.height/2, 20, this._bg.height);
        this.add(this._matchmakingConfigs[id]);

        if (fake)
        {
            let numConfigs = Object.keys(this._matchmakingConfigs).length;

            // @ts-ignore
            this._matchmakingConfigs[id].updateConfig({MatchmakingConfigId:id, Instances:[], Name:"Matchmaking Config "+numConfigs})
        }
        this._elementGroup.add(this._matchmakingConfigs[id]);

        this._matchmakingConfigs[id].alpha=0;
        this.scene.tweens.add({
            targets: this._matchmakingConfigs[id],
            alpha: 1,
            duration: 400,
            ease: Phaser.Math.Easing.Linear
        });

        this.updateConfigDimensions();
    }

    public updateConfigDimensions()
    {
        let numMatchmakingConfigs = this.ChildElements.length
        let MatchmakingConfigWidth = (this.width / numMatchmakingConfigs) - 20;

        if (numMatchmakingConfigs==1)
        {
            MatchmakingConfigWidth=500;
        }

        Object.keys(this._matchmakingConfigs).map((MatchmakingConfigId)=>
        {
            this._matchmakingConfigs[MatchmakingConfigId].updateConfigDimensions(MatchmakingConfigWidth, this._bg.height);
        });

        this.layoutContainer();
    }
}