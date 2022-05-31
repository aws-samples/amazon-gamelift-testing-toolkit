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

export class SimpleJsonPopup extends Popup
{
    protected _title : string;

    constructor (scene:Phaser.Scene, x:number, y:number, title:string="")
    {
        super(scene, x, y);
        this._htmlName="simpleJsonPopup";
        this._title = title;
    }

    setPopupData(data:any)
    {
        const container = document.getElementById("simpleJson")
        this._popup.node.querySelector(".title").innerHTML=this._title;
        const options:JSONEditorOptions = {mode:"view"}

        console.log(data);
        const editor = new JSONEditor(container, options);
        editor.set(data);
        editor.expandAll();
    }

    resetJson()
    {
        this._popup.node.querySelector("#simpleJson").innerHTML="";
    }
}