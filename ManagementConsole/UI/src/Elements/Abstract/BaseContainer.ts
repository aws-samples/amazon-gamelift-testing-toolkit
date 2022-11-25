// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Group = Phaser.GameObjects.Group;
import {EventDispatcher} from "../../Events/EventDispatcher";
import Container = Phaser.GameObjects.Container;
import {RoundedRectangle} from "../RoundedRectangle";
import {ScreenResolution} from "../../Data/ScreenResolution";

export abstract class BaseContainer extends Container
{
    protected _elementGroup:Group;
    protected _bg:RoundedRectangle;
    protected _groupOffsetX=0;
    protected _groupOffsetY=0;
    protected _emitter:EventDispatcher;
    protected _over:boolean;

    protected abstract _layoutRows;

    protected constructor(scene, x, y) {
        super(scene, x, y);
        this._elementGroup = new Group(scene);
        this._emitter = EventDispatcher.getInstance();
        this._over=false;
    }

    public abstract get ChildElements();
    public abstract handleClick(localX, localY);

    public setupEventListeners() {
        this._bg.setInteractive({ cursor:"pointer" });
        this._bg.off("pointerdown");
        this._bg.on('pointerdown', (pointer, localX, localY, event) =>
        {
            event.stopPropagation();
            this.handleClick(localX, localY);
        });

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
            this._over=false;
            this.handleOut();
        });

    }

    handleOver()
    {
    }

    handleOut()
    {
    }

    layoutContainer(padding:number=2)
    {
        this.setupEventListeners();

        if (this.ChildElements==null)
        {
            return;
        }

        let numElements:number = this.ChildElements.length;

        if (numElements==0)
        {
            return;
        }
        let firstElement = this.ChildElements[0];

        let groupChildren = this._elementGroup.getChildren();
        let columns = Math.floor(this._bg.displayWidth/(firstElement.displayWidth+padding));
        let groupWidth:number = columns  * (firstElement.displayWidth+padding);
        if (groupChildren.length<columns)
        {
            groupWidth = (firstElement.displayWidth+padding) * groupChildren.length;
        }

        let groupHeight:number = this._layoutRows * firstElement.displayHeight;

        let layoutOptions = {
            width: columns,
            height: this._layoutRows,
            position: Phaser.Display.Align.CENTER,
            cellWidth: firstElement.displayWidth+padding,
            cellHeight: firstElement.displayHeight+padding,
            x: (this._bg.displayWidth - groupWidth)/2,
            y: this._groupOffsetY,
        };

        Phaser.Actions.GridAlign(groupChildren, layoutOptions);

    }

    getDottedLineTexture(textureName:string)
    {
        this.scene.textures.removeKey(textureName);
        let texture = this.scene.textures.createCanvas(textureName, ScreenResolution.width, 4);
        texture.getContext().beginPath();
        texture.getContext().lineWidth = 4;
        texture.getContext().strokeStyle = 'white';
        texture.getContext().setLineDash([2,3]);
        texture.getContext().moveTo(0, 0);
        texture.getContext().lineTo(ScreenResolution.width , 0);
        texture.getContext().stroke();
        texture.getContext().closePath();
        texture.refresh();
        return texture;
    }


}