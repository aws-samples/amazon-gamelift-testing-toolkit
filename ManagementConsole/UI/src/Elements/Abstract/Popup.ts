// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import DOMElement = Phaser.GameObjects.DOMElement;
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Rectangle = Phaser.GameObjects.Rectangle;
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import {SubPopup} from "./SubPopup";
import {ScreenResolution} from "../../Data/ScreenResolution";
import {Game} from "../../Game";

export abstract class Popup extends Phaser.GameObjects.Container
{
    protected _popup: DOMElement;
    protected _emitter: EventDispatcher;
    protected _bg: Rectangle;
    protected _htmlName:string;
    protected _html:string;
    protected _subPopups: Record<string, SubPopup>;
    protected _currentSubPopup;

    protected constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);

        this._subPopups= {};
        this._emitter = EventDispatcher.getInstance();
    }

    drawPopup()
    {
        this._popup?.destroy();
        this._popup= null;

        this._popup = this.scene.add.dom(0, 0).createFromCache(this._htmlName);
        if (Game.debugMode)
        {
            $(this._popup.node).prepend('<div id="popupHeader" style="width:100%; background-color: #ff0000; color:#fff">DEBUG MODE</div>');
            this.dragElement(this._popup.node);
        }
        this.add(this._popup);
        this._html = this._popup.node.outerHTML;

        this._popup.setOrigin(0.5,0.5);
        this._popup.x=0;
        this._popup.y=0;
        this._popup.setPerspective(800);
        this._popup.addListener("mousedown");
        this._popup.on('mousedown', this.onPopupClick);
        this.setVisible(false);
    }

    registerSubPopup(subPopupName:string, subPopup: SubPopup)
    {
        this._subPopups[subPopupName] = subPopup;
    }

    switchSubPopup(subPopupName:string)
    {
        this._currentSubPopup?.removeEventListeners();
        this._subPopups[subPopupName].setupEventListeners();
        this._subPopups[subPopupName].loadContent();
        this._currentSubPopup = this._subPopups[subPopupName];
    }

    drawComplete()
    {

    }

    get element()
    {
        return $(this._popup.node);
    }

    show(event:PopupClickEvent)
    {
        this.drawPopup();

        this.setPopupData(event);
        this._popup.x = ScreenResolution.width/2;
        this._popup.y = ScreenResolution.height/2;

        this.setVisible(true);
        this.drawComplete();
    }

    abstract setPopupData(data:PopupClickEvent):void


    hide()
    {
        this.x=0;
        this.setVisible(false);
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        switch (event.target.className) {
            case "closeButton":
                this._emitter.emit(Events.CLOSE_POPUP);
                this.setVisible(false);
                break;
        }
    }

    onBgClick = async ()=>
    {
        this.setVisible(false);
    }

    removeEventListeners()
    {

    }

    public destroy() {
        Object.values(this._subPopups).map((subpopup=>
        {
            subpopup.removeEventListeners();
        }))
        this._currentSubPopup=null;
        this.removeEventListeners();
        super.destroy();
    }

    dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById("popupHeader")) {
            // if present, the header is where you move the DIV from:
            document.getElementById("popupHeader").onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
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
            var table = $("#"+id).DataTable(config);
            return table;
        }
    }
}