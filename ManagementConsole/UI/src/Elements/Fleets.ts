// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {Fleet} from "./Fleet";
import Rectangle = Phaser.GameObjects.Rectangle;
import {Instance} from "./Instance";
import {BaseContainer} from "./Abstract/BaseContainer";
import {Events} from "../Events/Events";
import {PopupClickEvent} from "../Events/PopupClickEvent";
import BitmapText = Phaser.GameObjects.BitmapText;
import Image = Phaser.GameObjects.Image;
import {RoundedRectangle} from "./RoundedRectangle";
import {GameSessionQueue} from "./GameSessionQueue";

export class Fleets extends BaseContainer
{
    protected _titleText:BitmapText;
    protected _fleets : Record<string, Fleet>;
    protected _layoutRows = 1;
    protected _maxDisplayFleets:number = 20;
    protected _groupOffsetY = 30;
    protected _addedFleets:number=0;

    constructor (scene:Phaser.Scene, x:number, y:number, width:number, height:number)
    {
        super(scene, x, y);
        this._fleets = {};

        let dottedLineTexture = this.getDottedLineTexture("fleetsLine");
        let img = new Image(scene, 0, 0, dottedLineTexture).setOrigin(0);
//        img.setOrigin(0,0);
        this.add(img);

        this._titleText = this.scene.add.bitmapText(5, 3, "Noto Sans", "Fleets", 16);
        this._titleText.setOrigin(0,0);
        this.add(this._titleText);

//        this._titleText.x = this._bg.getTopLeft().x;
//        this._titleText.y = img.y;
        this._bg = new RoundedRectangle(scene, 0, this._groupOffsetY, width, height-this._groupOffsetY, 0x66ffff).setOrigin(0);
        this.add(this._bg);
        this._bg.alpha=0;

        this.setSize(width, height);
    }

    public getInstanceByIp(ip):Instance
    {
        let foundInstance=null;
        Object.values(this._fleets).map((fleet)=>
        {
            let instance = fleet.getInstanceByIp(ip);
            if (instance!=null)
            {
                foundInstance = instance;
            }
        });

        return foundInstance;
    }

    public get ChildElements():Fleet[]
    {
        return Object.values(this._fleets);
    }

    public get Fleets()
    {
        return this._fleets;
    }

    public redrawFleets()
    {
        Object.keys(this._fleets).map((fleetId)=>
        {
            this._fleets[fleetId].updateFleet(this._fleets[fleetId].Data);
        });
    }

    public updateFleet(fleet:DataTypes.FleetData)
    {
        if (this._fleets[fleet.FleetId]==undefined)
        {
            this.addFleet(fleet.FleetId);
        }
        this._fleets[fleet.FleetId].updateFleet(fleet);

        this.updateFleetDimensions();
    }

    public handleClick(localX, localY) {
        this._emitter.emit(Events.SHOW_FLEET_POPUP, new PopupClickEvent(this, localX, localY));
    }

    public addFleet(id:string, fake:boolean=false)
    {
        this._fleets[id] = new Fleet(this.scene, this._bg.x + this._bg.width/2, this._bg.y + this._bg.height/2, 20, this._bg.height);

        if (this._addedFleets < this._maxDisplayFleets)
        {
            this._addedFleets++;
            this.add(this._fleets[id]);
        }
        else
        {
            this.add(this._fleets[id]);
            this._fleets[id].setVisible(false);
        }

        if (fake)
        {
            // @ts-ignore
            this._fleets[id].updateFleet({FleetId:id, Instances:[], Name:"Fleet"})
        }
        this._elementGroup.add(this._fleets[id]);

        this._fleets[id].alpha=0;
        this.scene.tweens.add({
            targets: this._fleets[id],
            alpha: 1,
            duration: 400,
            ease: Phaser.Math.Easing.Linear
        });

        this.updateFleetDimensions();
    }

    public removeDeletedFleets(fleetsData:DataTypes.FleetData[])
    {
        var updatedFleetIds = fleetsData.map(({FleetId}) => (FleetId));

        Object.keys(this._fleets).map((fleetId)=>
        {
            if (updatedFleetIds.indexOf(fleetId)===-1)
            {
                this._fleets[fleetId].destroy();
                delete this._fleets[fleetId];
            }
        });

        this.updateFleetDimensions();

    }

    public getFleetByArn(arn:string):Fleet
    {
        let foundFleet=null;
        Object.values(this._fleets).map((fleet)=>
        {
            if (fleet.Data.FleetAttributes.FleetArn==arn)
            {
                foundFleet = fleet;
            }
        });

        return foundFleet;
    }

    public getFleetById(fleetId:string):Fleet
    {
        let foundFleet=null;
        Object.values(this._fleets).map((fleet)=>
        {
            if (fleet.Data.FleetId==fleetId)
            {
                foundFleet = fleet;
            }
        });

        return foundFleet;
    }

    public updateFleetDimensions()
    {
        let numFleets = Object.keys(this._fleets).length
        let fleetWidth = Math.floor(this.width / numFleets) - 3;

        if (numFleets==1)
        {
            fleetWidth=500;
        }

        Object.keys(this._fleets).map((fleetId)=>
        {
            this._fleets[fleetId].updateFleetDimensions(fleetWidth, this._bg.height);
        });

        this.layoutContainer();
    }
}