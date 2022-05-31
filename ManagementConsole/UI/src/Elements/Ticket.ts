// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';

export class Ticket extends Phaser.GameObjects.Sprite
{
    constructor (scene:Phaser.Scene, x:number, y:number, texture:string)
    {
        super(scene, x, y, texture);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 0, 4, 8] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 1, 5, 9] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 2, 6, 10] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers(this.texture.key, { frames: [ 3, 7, 11] }),
            frameRate: 8,
            repeat: -1
        });

    }

}