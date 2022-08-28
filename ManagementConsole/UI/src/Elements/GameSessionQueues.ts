// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {GameSessionQueue} from "./GameSessionQueue";
import config from "../Config/Config";
import Rectangle = Phaser.GameObjects.Rectangle;
import {Instance} from "./Instance";
import Group = Phaser.GameObjects.Group;
import {BaseContainer} from "./Abstract/BaseContainer";
import BitmapText = Phaser.GameObjects.BitmapText;
import Image = Phaser.GameObjects.Image;
import {RoundedRectangle} from "./RoundedRectangle";
import {Events} from "../Events/Events";

export class GameSessionQueues extends BaseContainer
{
    protected _gameSessionQueues : Record<string, GameSessionQueue>;
    protected _layoutRows = 1;
    protected _titleText:BitmapText;
    protected _groupOffsetY=30;
    protected _dottedLineImg:Image;

    constructor (scene:Phaser.Scene, x:number, y:number, width:number)
    {
        super(scene, x, y);
        this._gameSessionQueues = {};

        let dottedLineTexture = this.getDottedLineTexture("queuesLine");
        this._dottedLineImg = new Image(scene, 0, 0, dottedLineTexture).setOrigin(0);
//        img.setOrigin(0,0);
        this.add(this._dottedLineImg);

        this._titleText = this.scene.add.bitmapText(5, 3, "Noto Sans", "Queues", 16);
        this._titleText.setOrigin(0,0);
        this.add(this._titleText);

        this._bg = new RoundedRectangle(scene, 0, this._groupOffsetY, width, GameSessionQueue.queueHeight, 0xbbbb00).setOrigin(0);
        this.add(this._bg);
        this._bg.alpha=0;
        this.setSize(width, GameSessionQueue.queueHeight);
    }

    public resize(width:number, height:number)
    {
        let dottedLineTexture = this.getDottedLineTexture("queuesLine");
        this._dottedLineImg.texture = dottedLineTexture;
        this._dottedLineImg.destroy();
        this._dottedLineImg = new Image(this.scene, 0, 0, dottedLineTexture).setOrigin(0);
        this.add(this._dottedLineImg);

        this._bg.drawRectangle(width, height);
        this.setSize(width, height);

        this.updateQueueDimensions();
    }

    public getQueueByArn(arn:string):GameSessionQueue
    {
        let foundQueue=null;
        Object.keys(this._gameSessionQueues).map((queueName:string)=>
        {
            if (this._gameSessionQueues[queueName].Data.GameSessionQueueArn == arn)
            {
                foundQueue = this._gameSessionQueues[queueName];
            }
        });

        return foundQueue;
    }

    public get ChildElements()
    {
        return Object.values(this._gameSessionQueues);
    }

    public updateQueue(gameSessionQueue:DataTypes.GameSessionQueue)
    {
        if (this._gameSessionQueues[gameSessionQueue.Name]==undefined)
        {
            this._gameSessionQueues[gameSessionQueue.Name] = new GameSessionQueue(this.scene, 0, 0, 20);
            this.addGameSessionQueue(gameSessionQueue.Name);
        }

        this._gameSessionQueues[gameSessionQueue.Name].updateQueue(gameSessionQueue);
        this.updateQueueDimensions();
    }

    public addGameSessionQueue(id:string, fake:boolean=false)
    {
        this._gameSessionQueues[id] = new GameSessionQueue(this.scene, this._bg.x + this._bg.width/2,this._bg.y + this._bg.height/2, 20);
        this.add(this._gameSessionQueues[id]);

        if (fake)
        {
            let numQueues = Object.keys(this._gameSessionQueues).length;
            // @ts-ignore
            this._gameSessionQueues[id].updateQueue({GameSessionQueueId:id, Instances:[], Name:"GameSessionQueue "+numQueues})
        }
        this._elementGroup.add(this._gameSessionQueues[id]);

        this._gameSessionQueues[id].alpha=0;
        this.scene.tweens.add({
            targets: this._gameSessionQueues[id],
            alpha: 1,
            duration: 400,
            ease: Phaser.Math.Easing.Linear
        });

        this.updateQueueDimensions();
    }

    public updateQueueDimensions()
    {
        let numGameSessionQueues = Object.keys(this._gameSessionQueues).length
        let GameSessionQueueWidth = (this.width / numGameSessionQueues) - 20;

        if (numGameSessionQueues==1)
        {
            GameSessionQueueWidth=500;
        }

        Object.keys(this._gameSessionQueues).map((GameSessionQueueId)=>
        {
            this._gameSessionQueues[GameSessionQueueId].updateQueueDimensions(GameSessionQueueWidth, this._bg.height);
        });

        this.layoutContainer();
    }

    public handleClick(localX, localY)
    {

    }

}