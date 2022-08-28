// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import RoundRectangle from "phaser3-rex-plugins/plugins/gameobjects/shape/roundrectangle/RoundRectangle";

export class RoundedRectangle extends RoundRectangle
{
    protected _color:number = 0;
    protected _radius:number;

    constructor(scene, x, y, width, height, color:number, radius:number=8) {
        super(scene, x, y, width, height, radius, color);

        this._color = color;
        this._radius = radius;
    }

    updateColor(color:number)
    {
        this.fillColor = color;
    }

    drawRectangle(width:number, height:number, color:number=null)
    {
        this.width = width;
        this.height = height;
        if (color!=null)
        {
            this.fillColor = color;
        }
    }
}