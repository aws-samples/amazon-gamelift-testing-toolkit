// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {Instance} from "./Instance";
import {BaseContainer} from "./Abstract/BaseContainer";
import {GameSession} from "./GameSession";
import {Events} from "../Events/Events";
import {PopupClickEvent} from "../Events/PopupClickEvent";
import BitmapText = Phaser.GameObjects.BitmapText;
import {FleetMenu} from "./Menus/FleetMenu";
import {RoundedRectangle} from "./RoundedRectangle";
import Group = Phaser.GameObjects.Group;
import {LocationPopover} from "./Menus/LocationPopover";
import {ConsoleScene} from "../Scenes/ConsoleScene";
import {ScreenResolution} from "../Data/ScreenResolution";

export class Fleet extends BaseContainer
{
    protected _nameText:BitmapText;
    protected _statsText:BitmapText;
    protected _fleet:DataTypes.FleetData;
    protected _instances:Record<string, Instance>;
    protected _instanceGroup: Group;
    protected _gameSessions:Record<string, GameSession>
    protected _gameSessionGroup: Group;
    protected _maxDisplayInstances:number = 100;
    protected _addedInstances:number=0;
    protected _groupOffsetY = 65;
    protected _layoutRows = 10;
    protected _fleetMenu: FleetMenu;
    protected _fleetLocationPopover: LocationPopover;
    public showInstances:boolean = true;

    constructor (scene:Phaser.Scene, x:number, y:number, width:number)
    {
        super(scene, x, y);
        this._instances = {};
        this._gameSessions = {};
        this._instanceGroup = new Group(scene);
        this._gameSessionGroup = new Group(scene);
        this._elementGroup = this._instanceGroup;

        this.drawFleet(width, Fleet.fleetHeight);
        this.setSize(width, Fleet.fleetHeight);
    }

    public get ChildElements()
    {
        if (this.showInstances)
        {
            return Object.values(this._instances);
        }
        else
        {
            return Object.values(this._gameSessions);
        }
    }

    public get Data():DataTypes.FleetData
    {
        return this._fleet;
    }

    public getInstanceByIp(ip):Instance {
        let instances: Instance[] = Object.values(this._instances);
        let matchingInstances = instances.filter(instance => instance.Data.IpAddress == ip);
        if (matchingInstances.length)
        {
            return matchingInstances[0];
        }
        return null;
    }

    public static get fleetHeight():number
    {
        if (ScreenResolution.displayResolution==ScreenResolution.RES_720P)
        {
            return 300;
        }
        else
        {
            return 460;
        }
    }

    resize(width:number, height:number)
    {
        console.log("RESIZING FLEET TO", width, height);
        this._bg.drawRectangle(width, height);
    }

    drawFleet(width:number, height:number)
    {
        this._bg?.destroy();
        this._bg = new RoundedRectangle(this.scene, 0, 0, width, height, 0x373f51).setOrigin(0);
        this.add(this._bg);

        //this.drawBg(width, height);

        this._nameText = this.scene.add.bitmapText(0, 0, "Noto Sans", "Fleet!", 13);
        this._nameText.setOrigin(0,0);
        this.add(this._nameText);

        this._statsText = this.scene.add.bitmapText(0, 0, "Noto Sans", "Fleet!", 13);
        this._statsText.setOrigin(0,0);
        this.add(this._statsText);

        this._fleetMenu?.destroy();
        this._fleetMenu = new FleetMenu(this.scene, 0, 0, this);
        this.add(this._fleetMenu);
        this._fleetMenu.menuEmitter.addListener(Events.TOGGLE_FLEET_DISPLAY, this.onToggleFleetDisplay, this);

        this._fleetLocationPopover?.destroy();
        this._fleetLocationPopover = new LocationPopover(this.scene, 0, 0, this);
        this.add(this._fleetLocationPopover);
    }

    onToggleFleetDisplay()
    {
        this.showInstances = !this.showInstances;
        this._elementGroup = (this.showInstances) ? this._instanceGroup : this._gameSessionGroup;
        this.updateFleet(this._fleet);
        this.updateFleetDimensions(this._bg.width, this._bg.height);
    }

    updateFleet(fleet:DataTypes.FleetData)
    {
        const instanceIds = fleet.Instances?.map(x => x.InstanceId);
        const gameSessionIds = fleet.GameSessions?.map(x => x.GameSessionId);

        this._fleet?.Instances?.map((instance)=>
        {
            if (instanceIds.indexOf(instance.InstanceId)===-1 || instance.Status.Value=="TERMINATED")
            {
                this.removeInstance(instance.InstanceId);
            }
        });

        this._fleet?.GameSessions?.map((gameSession)=>
        {
            if (gameSessionIds.indexOf(gameSession.GameSessionId)===-1 || gameSession.Status.Value=="TERMINATED")
            {
                this.removeGameSession(gameSession.GameSessionId);
            }
        });

        this._fleet = fleet;

        this._nameText.text = fleet.FleetAttributes?.Name;

        this._fleet.Instances?.map((instance)=>
        {
            if (this._instances[instance.InstanceId]==undefined)
            {
                this.addInstance(instance.InstanceId);
            }

            this._instances[instance.InstanceId].updateInstance(instance);
        });


        this._fleet.GameSessions?.map((gameSession)=>
        {
            if (this._gameSessions[gameSession.GameSessionId]==undefined)
            {
                this.addGameSession(gameSession.GameSessionId);
            }

            this._gameSessions[gameSession.GameSessionId].updateGameSession(gameSession);

        });
        this.updateStatsText();

        this.updateVisibility();
    }

    updateVisibility()
    {
        const instanceElements = Object.values(this._instances);
        instanceElements.map((instance)=>
        {
            instance.visible = (this.showInstances && ConsoleScene.animationsEnabled) ? true : false;
        });

        const gameSessionElements = Object.values(this._gameSessions);
        gameSessionElements.map((gameSession)=>
        {
            gameSession.visible = (!this.showInstances && ConsoleScene.animationsEnabled) ? true : false;
        });

        this._statsText.visible= (!ConsoleScene.animationsEnabled) ? true : false;
    }

    updateStatsText()
    {
        let gameSessionStats={"ACTIVE":0, "TERMINATED":0, "TOTAL":0};
        this._fleet.GameSessions?.map((gameSession)=>
        {
            if (gameSession.Status.Value)
            {
                gameSessionStats[gameSession.Status.Value]++;
            }
            gameSessionStats["TOTAL"]++;
        });
        let instanceStats={"TOTAL":0, "ACTIVE":0, "PENDING":0, "TERMINATING":0};
        this._fleet.Instances?.map((instance)=>
        {
            instanceStats["TOTAL"]++;
            if (instance.Status.Value)
            {
                instanceStats[instance.Status.Value]++;
            }
        })
        console.log(gameSessionStats);
        console.log(instanceStats);
        this._statsText.text = "Total Instances: " + instanceStats["TOTAL"] + "\n";
        this._statsText.text += "Active Instances: " + instanceStats["ACTIVE"] + "\n";
        this._statsText.text += "Pending Instances: " + instanceStats["PENDING"] + "\n";
        this._statsText.text += "Total Game Sessions: " + gameSessionStats["TOTAL"] + "\n";
        this._statsText.text += "Active Game Sessions: " + gameSessionStats["ACTIVE"] + "\n";
        this._statsText.x = this.displayWidth/2;
        this._statsText.y = 100;
    }

    updateFleetDimensions(width:number, height:number)
    {
/*
        this.scene.tweens.add({
            targets: this._bg,
            width:width,
            height:height,
            duration: 1000,
            ease: Phaser.Math.Easing.Linear
        });
*/
        this._bg.drawRectangle(width, height);

        this._nameText.setOrigin(0.5);
        this._statsText.setOrigin(0.5);

        console.log("TEXT VS FLEET", this._nameText.width, this._bg.width);
        if (this._nameText.width>this._bg.width-40)
        {
            this._nameText.setVisible(false);
        }
        else
        {
            this._nameText.setVisible(true);
        }

        this._fleetMenu.x = this._bg.getTopLeft().x + this._fleetMenu.width/2 + 5;
        this._fleetMenu.y = this._bg.getTopLeft().y + this._fleetMenu.height/2 + 5;

        this._fleetLocationPopover.x = this._bg.getTopRight().x - this._fleetLocationPopover.width/2 - 5;
        this._fleetLocationPopover.y = this._bg.getTopRight().y + this._fleetLocationPopover.height/2 + 4;

        this._nameText.x = this._bg.getTopCenter().x;
        this._nameText.y = Math.floor(this._bg.getTopCenter().y + this._nameText.height/2 + 5);

        this.setSize(this._bg.displayWidth, this._bg.displayHeight);
        this.layoutContainer();

    }

    public handleClick(localX, localY)
    {

        console.log("CLICK ON FLEET!");
        if (this._fleetMenu.menuVisible==false)
        {
            this._emitter.emit(Events.CLOSE_MENUS);
            this._emitter.emit(Events.SHOW_FLEET_POPUP, new PopupClickEvent(this, localX, localY));
        }
        else
        {
            this._emitter.emit(Events.CLOSE_MENUS);
        }
    }

    public addInstance(id:string, fake:boolean=false)
    {
        this._instances[id] = new Instance(this.scene, this._bg.x, this._bg.y);
//        this._fleets[id] = new Fleet(this.scene, this._bg.x + this._bg.width/2, this._bg.y + this._bg.height/2, 20, this._bg.height);

        if (fake)
        {
            // @ts-ignore
            this._instances[id].updateInstance({"InstanceId":id})
        }
        this._instanceGroup.add(this._instances[id]);
        if (this._addedInstances < this._maxDisplayInstances)
        {
            this._addedInstances++;
            this.add(this._instances[id]);
        }
        else
        {
            this.add(this._instances[id]);
            this._instances[id].setVisible(false);
        }

        if (this.showInstances==false)
        {
            this._instances[id].setVisible(false);
        }
        else
        {
            this._instances[id].alpha=0;
            this.scene.tweens.add({
                targets: this._instances[id],
                alpha: 1,
                duration: 2000,
                ease: 'Power3'
            });
        }

        this.layoutContainer();
    }

    public addGameSession(id:string, fake:boolean=false)
    {
        this._gameSessions[id] = new GameSession(this.scene, this._bg.x, this._bg.y);

        if (fake)
        {
            // @ts-ignore
            this._gameSessions[id].updateGameSession({"GameSessionId":id})
        }
        this._gameSessionGroup.add(this._gameSessions[id]);
        this.add(this._gameSessions[id]);

        if (this.showInstances)
        {
            this._gameSessions[id].setVisible(false);
        }

        this._gameSessions[id].alpha=0;
        this.scene.tweens.add({
            targets: this._gameSessions[id],
            alpha: 1,
            duration: 2000,
            ease: 'Power3'
        });

        this.layoutContainer();
    }

    public removeInstance(id:string)
    {
        this._instances[id].destroy();
        delete this._instances[id];

        this.layoutContainer();
    }

    public removeGameSession(id:string)
    {
        this._gameSessions[id]?.destroy();
        delete this._gameSessions[id];

        this.layoutContainer();
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