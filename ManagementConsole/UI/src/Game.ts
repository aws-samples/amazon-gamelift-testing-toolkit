// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {ConsoleScene} from './Scenes/ConsoleScene'
import {LoginScene} from './Scenes/LoginScene'
import {Network} from './Network/Network'
import config from './Config/Config'
import {BootScene} from "./Scenes/BootScene";
import {PreloaderScene} from "./Scenes/PreloaderScene";

declare const window: any;

export class Game extends Phaser.Game {

    public network : Network;
    public static debugMode: boolean = false;

    constructor () {
        super(config);

        this.network = new Network();

        this.scene.add('Boot', BootScene);
        this.scene.add('Preloader', PreloaderScene);
        this.scene.add('Login', LoginScene);
        this.scene.add('Console', ConsoleScene);
        this.scene.start('Boot');
    }
}

(function(){
    var realConsoleLog = console.log;
    console.log = function() {
        if (Game.debugMode)
        {
            realConsoleLog.apply(console, arguments);
        }
    }
})();

window.game = new Game();
