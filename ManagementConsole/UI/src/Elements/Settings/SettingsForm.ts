// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {EventDispatcher} from "../../Events/EventDispatcher";
import DOMElement = Phaser.GameObjects.DOMElement;

export abstract class SettingsForm extends Phaser.GameObjects.Container
{
    protected _element: DOMElement;
    protected _emitter: EventDispatcher;

    constructor (scene:Phaser.Scene, x:number, y:number, htmlName:string)
    {
        super(scene, x, y);
        this._emitter = EventDispatcher.getInstance();

        this._element = this.scene.add.dom(0, 0).createFromCache(htmlName);
        this.add(this._element);
        this._element.setOrigin(0,0);
        this._element.y=5;
        this._element.setPerspective(800);

        this.setVisible(false);
    }

    public show()
    {
        this._element.setInteractive();
        this._element.addListener("click");
        this._element.on('click', this.onClick);
        this.setVisible(true);
    }

    public hide()
    {
        this.setVisible(false);
    }

    protected onClick = (event) =>
    {
        event.stopPropagation();
    };
}