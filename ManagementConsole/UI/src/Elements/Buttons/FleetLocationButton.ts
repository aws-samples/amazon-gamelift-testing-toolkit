// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "phaser";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Image = Phaser.GameObjects.Image;
import {SimpleButton} from "../Abstract/SimpleButton";

export class FleetLocationButton extends SimpleButton
{
    constructor(scene:Phaser.Scene, x:number, y:number) {
        super(scene, x, y, "location.png");
    }

    public onClick (pointer, localX, localY, event)
    {
        event.stopPropagation();
    }
}