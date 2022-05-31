// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Fleet} from "../Fleet";
import DOMElement = Phaser.GameObjects.DOMElement;
import {Network} from "../../Network/Network";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Rectangle = Phaser.GameObjects.Rectangle;
import config from "../../Config/Config"
import {Popup} from "../Abstract/Popup";
import JSONEditor, {JSONEditorOptions} from "jsoneditor";

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