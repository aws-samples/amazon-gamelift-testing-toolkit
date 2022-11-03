// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
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
        const container = $("#simpleJson")[0];
        $(".title").html(this._title);

        const options:JSONEditorOptions = {mode:"view"}
        const editor = new JSONEditor(container, options);

        editor.set(data);
        editor.expandAll();
    }

    resetJson()
    {
        this.element.find("#simpleJson").html("");
    }
}