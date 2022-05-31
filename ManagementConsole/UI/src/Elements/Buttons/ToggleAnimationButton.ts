// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Image = Phaser.GameObjects.Image;
import {ToggleButton} from "../Abstract/ToggleButton";

export class ToggleAnimationButton extends ToggleButton
{
    constructor(scene:Phaser.Scene, x:number, y:number, animationsEnabled:boolean) {
        super(scene, x, y, "animationon.png", "animationoff.png", !animationsEnabled);
    }

    public onClick (pointer, localX, localY, event)
    {
        super.onClick(pointer, localX, localY, event);
        event.stopPropagation();
        if (this._toggled)
        {
            this._globalEmitter.emit(Events.DISABLE_ANIMATIONS);
        }
        else
        {
            this._globalEmitter.emit(Events.ENABLE_ANIMATIONS);
        }
    }
}