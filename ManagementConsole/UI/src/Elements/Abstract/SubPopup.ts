// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import DOMElement = Phaser.GameObjects.DOMElement;
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Game} from "../../Game";

export abstract class SubPopup
{
    protected _parentPopup: DOMElement;
    protected _emitter: EventDispatcher;
    protected _cacheKey: string;
    protected _parentDomId: string;
    protected _html:string;

    protected constructor (cacheKey:string, parentDomId:string)
    {
        this._cacheKey = cacheKey;
        this._parentDomId = parentDomId;
        this._emitter = EventDispatcher.getInstance();
    }

    loadContent()
    {
        this.selector.html(Game.game.cache.html.get(this._cacheKey));
        this._html = this.selector.html();
        this.refresh();
    }

    get domId()
    {
        return this._parentDomId;
    }

    public get selector():JQuery
    {
        return $('#' + this._parentDomId);
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

    resetElement(selector)
    {
        let el = $("<div>" + this._html + "</div>");
        this.selector.find(selector).html(el.find(selector).html());
    }

    showSuccessAlert = (text) =>
    {
        this.selector.find("#statusText").attr("class","alert alert-success");
        this.selector.find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        this.selector.find("#statusText").attr("class","alert alert-danger");
        this.selector.find("#statusText").html(text);
    }

    hideStatusAlert()
    {
        this.selector.find("#statusText").attr("class", "alert hide");
    }

    activateDataTable(id, config=null) {
        // @ts-ignore
        if ( ! $.fn.DataTable.isDataTable( '#'+id ) )
        {
            if (config==null)
            {
                config = {
                    scrollY: "400px",
                    scrollCollapse: true,
                    columnDefs: [
                        { width: 200, targets: 0 }
                    ],
                    order: [[ 0, "desc" ]],

                };
            }
            // @ts-ignore
            return this.selector.find("#"+id).DataTable(config);
        }
    }

    updateTableOrderValues(table) {
        for (let i=0; i<table.rows().data().length; i++)
        {
            let rowData = table.row(i).data();
            rowData[0] = i+1;
            table.row(i).data(rowData).draw();
        }
    }

    onPopupClick = async (event) =>
    {
    }
}