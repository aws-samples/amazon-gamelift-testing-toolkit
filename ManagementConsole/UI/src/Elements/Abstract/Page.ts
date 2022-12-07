// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {EventDispatcher} from "../../Events/EventDispatcher";
import {PageManager} from "../Pages/PageManager";
import {Game} from "../../Game";

export abstract class Page
{
    protected _parentPage: Page;
    protected _emitter: EventDispatcher;
    protected _cacheKey: string;
    protected _domId: string;
    protected _html:string;
    protected _pageData:any = {};

    protected constructor (cacheKey:string, parentPage:Page, domId:string=null)
    {
        this._cacheKey = cacheKey;
        this._parentPage = parentPage;
        this._emitter = EventDispatcher.getInstance();
        this._domId = domId;
        this.loadContent();
    }

    loadContent()
    {
        let html = Game.game.cache.html.get(this._cacheKey);
        $('#'+this._domId).html(html);
        this._html = $('#'+this._domId).html();
    }

    hideStatusAlert()
    {
        $('#'+this._domId).find("#statusText").attr("class","alert hide");
    }

    public setPageData(data:any)
    {
        this._pageData = data;
    }

    public get domId()
    {
        return this._domId;
    }

    public setParent(parentPage:Page)
    {
        this._parentPage = parentPage;
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

    showPage()
    {
        $('#' + this._domId).show();
        this.setupEventListeners();
        this.initPage();
    }

    hidePage()
    {
        $('#' + this._domId).hide();
        this.removeEventListeners();
        this.cleanupPage();
    }

    initPage()
    {

    }

    cleanupPage()
    {

    }

    goBack(pageData:any = null)
    {
        if (this._parentPage!=null)
        {
            PageManager.switchPage(this._parentPage.domId, pageData);
        }
    }

    public get html()
    {
        return this._html;
    }

    public onPopupClick(event)
    {

    }

    showSuccessAlert = (text) =>
    {
        $('#'+this._domId).find("#statusText").attr("class","alert alert-success");
        $('#'+this._domId).find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        $('#'+this._domId).find("#statusText").attr("class","alert alert-danger");
        $('#'+this._domId).find("#statusText").html(text);
    }

    resetPage()
    {
        $('#'+this._domId).html(this._html);
    }

    resetElement(selector)
    {
        let el = $("<div>" + this._html + "</div>");
        $('#'+this._domId).find(selector).html(el.find(selector).html());
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
            return $('#'+this._domId).find("#"+id).DataTable(config);
        }
    }
}