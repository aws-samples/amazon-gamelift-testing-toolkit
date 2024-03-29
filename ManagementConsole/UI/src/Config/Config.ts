// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import RoundRectanglePlugin from 'phaser3-rex-plugins/dist/rexroundrectangle.min.js'

export default {
    type: Phaser.AUTO,
    backgroundColor: '#ffffff',
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-example',
        width: '100%',
        height: '100%'
    },
    antialias: true,
    dom: {
        createContainer: true,
    },
    plugins: {
        global: [ RoundRectanglePlugin ],
    },
};