// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import Graphics = Phaser.GameObjects.Graphics;
import GameObject = Phaser.GameObjects.GameObject;
import Container = Phaser.GameObjects.Container;
import RoundRectangle from "phaser3-rex-plugins/plugins/gameobjects/shape/roundrectangle/RoundRectangle";

export class RoundedRectangle extends RoundRectangle
{
    protected _color:number = 0;
    protected _graphics:Graphics;
    protected _radius:number;
    protected _rr:RoundRectangle;

    constructor(scene, x, y, width, height, color:number, radius:number=8) {
        super(scene, x, y, width, height, radius, color);

        this._color = color;
        this._radius = radius;

        //this.drawRectangle(width, height);
    }

    updateColor(color:number)
    {
        this.fillColor = color;
        /*
        if (color!=this._color)
        {
            this._color = color;
            this.drawRectangle(this.width, this.height, color)
        }

         */
    }

    drawRectangle(width:number, height:number, color:number=null)
    {
        this.width = width;
        this.height = height;
        if (color!=null)
        {
            this.fillColor = color;
        }
        //this._rr = new RoundRectangle(this.scene, 0, 0, this.width, this.height, this._radius, this._color);
        //this.add(this._rr);
        /*
                if (color!=null)
                {
                    this._color = color;
                }

                this.clear();
                this.resize(width, height);

                const graphics = new Graphics(this.scene)
                graphics.fillStyle(this._color, 1);
                graphics.fillRoundedRect(0, 0, width, height, this._radius);


                this.draw(graphics);


                graphics.destroy();
         */
    }
}