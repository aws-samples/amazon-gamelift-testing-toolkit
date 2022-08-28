// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import DOMElement = Phaser.GameObjects.DOMElement;
import {EventDispatcher} from "../../Events/EventDispatcher";

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