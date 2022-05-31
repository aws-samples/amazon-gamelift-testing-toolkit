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
import {PopupClickEvent} from "../../Events/PopupClickEvent";

export abstract class SubPopup
{
    protected _parentPopup: DOMElement;
    protected _emitter: EventDispatcher;
    protected _url: string;
    protected _parentDomId: string;
    protected _html:string;

    protected constructor (url:string, parentDomId:string)
    {
        this._url = url;
        this._parentDomId = parentDomId;
        this._emitter = EventDispatcher.getInstance();
    }

    loadContent()
    {
        $('#'+this._parentDomId).load(this._url, ()=>
        {
            this._html = $('#'+this._parentDomId).html();
            this.refresh();
        });
    }

    hideStatusAlert()
    {

    }

    refresh()
    {

    }

    setupEventListeners()
    {

    }

    removeEventListeners()
    {

    }
}