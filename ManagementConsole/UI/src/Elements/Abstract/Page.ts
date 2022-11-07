// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import DOMElement = Phaser.GameObjects.DOMElement;
import {EventDispatcher} from "../../Events/EventDispatcher";
import UUID = Phaser.Utils.String.UUID;
import {PageManager} from "../Pages/PageManager";

export abstract class Page
{
    protected _parentPage: Page;
    protected _emitter: EventDispatcher;
    protected _url: string;
    protected _domId: string;
    protected _html:string;
    protected _pageData:any = {};

    protected constructor (url:string, parentPage:Page, domId:string=null)
    {
        this._url = url;
        this._parentPage = parentPage;
        this._emitter = EventDispatcher.getInstance();
        this._domId = domId;
        this.loadContent();
    }

    loadContent()
    {
        $('#'+this._domId).load(this._url, (response, status, error)=>
        {
            this._html = $('#'+this._domId).html();
            this.refresh();
        });
    }

    hideStatusAlert()
    {

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
        $('#'+this._domId).find("#statusText")[0].className = "alert alert-success";
        $('#'+this._domId).find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        $('#'+this._domId).find("#statusText")[0].className = "alert alert-danger";
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
            var table = $('#'+this._domId).find("#"+id).DataTable(config);
            return table;
        }
    }
}