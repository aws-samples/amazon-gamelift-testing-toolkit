// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import jQuery from 'jquery';
// export for others scripts to use
window.$ = window.jQuery = jQuery;

import 'phaser';
import {ConsoleScene} from './Scenes/ConsoleScene'
import {LoginScene} from './Scenes/LoginScene'
import {Network} from './Network/Network'
import config from './Config/Config'
import {BootScene} from "./Scenes/BootScene";
import {PreloaderScene} from "./Scenes/PreloaderScene";

var dt = require( 'datatables.net' );
require( 'datatables.net-buttons-bs4' );
require( 'datatables.net-buttons/js/buttons.colVis.js' );
require( 'datatables.net-buttons/js/buttons.html5.js' );
require( 'datatables.net-responsive-bs4' );
require( 'datatables.net-rowreorder-bs4' );

declare const window: any;

export class Game extends Phaser.Game {

    public network : Network;
    public static debugMode: boolean = false;
    public static game:Phaser.Game;

    constructor () {
        super(config);

        Game.game = this;

        this.network = new Network();

        this.scene.add('Boot', BootScene);
        this.scene.add('Preloader', PreloaderScene);
        this.scene.add('Login', LoginScene);
        this.scene.add('Console', ConsoleScene.getInstance());
        this.scene.start('Boot');

        document.onkeydown = this.handleKeyboard;
    }

    handleKeyboard = (keyEvent) => {
        if (keyEvent.altKey && keyEvent.code=="KeyD")
        {
            if (Game.debugMode)
            {
                console.log("-- DISABLING DEBUG MODE --");
            }
            Game.debugMode = !Game.debugMode;
            if (Game.debugMode)
            {
                console.log("-- ENABLING DEBUG MODE --");
            }
        }
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
