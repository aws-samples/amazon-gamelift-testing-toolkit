// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import RoundRectanglePlugin from 'phaser3-rex-plugins/dist/rexroundrectangle.min.js'

export default {
    type: Phaser.AUTO,
    backgroundColor: '#ffffff',
    width: 1920,
    height: 1080,
    parent: 'phaser-example',
    antialias: true,
    dom: {
        createContainer: true,
    },
    plugins: {
        global: [ RoundRectanglePlugin ],
    },
};