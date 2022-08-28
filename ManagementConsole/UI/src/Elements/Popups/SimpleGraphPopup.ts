// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Popup} from "../Abstract/Popup";

export class SimpleGraphPopup extends Popup
{
    protected _title : string;

    constructor (scene:Phaser.Scene, x:number, y:number, title:string="")
    {
        super(scene, x, y);
        this._htmlName="simpleGraphPopup";
        this._title = title;
    }

    setPopupData(data:any)
    {
        console.log(data);
    }

    resetJson()
    {
        this._popup.node.querySelector("#simpleGraph").innerHTML="";
    }
}