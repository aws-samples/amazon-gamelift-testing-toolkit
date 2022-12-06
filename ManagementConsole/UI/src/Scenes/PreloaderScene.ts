// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {ScreenResolution} from "../Data/ScreenResolution";
import {SubPopups} from "../Elements/SubPopups/SubPopups";
import {Pages} from "../Elements/Pages/Pages";

export  class PreloaderScene extends Phaser.Scene {
    constructor () {
        super('Preloader');
    }

    create ()
    {
        for (let i=1;i<=16;i++)
        {
            this.textures.addSpriteSheetFromAtlas("char" + i, {
                atlas: "toolkit",
                frame: "characters/" + i + ".png",
                frameWidth: 16,
                frameHeight: 32
            });
        }

        this.scene.start('Login');
    }

    loadElements()
    {
        // GRAPHICS
        this.load.multiatlas("toolkit", "assets/textures.json", "assets");

        // FONT
        this.load.bitmapFont('Noto Sans', 'assets/webfonts/Noto Sans.png', 'assets/webfonts/Noto Sans.fnt');

        //LOGIN
        this.load.html('tokenForm', 'assets/html/tokenForm.html');

        // SETTINGS MENU
        this.load.html('settings', 'assets/html/settings.html');

        // POPUPS
        this.load.html('simpleJsonPopup', 'assets/html/popups/simpleJsonPopup.html');
        this.load.html('simpleGraphPopup', 'assets/html/popups/simpleGraphPopup.html');
        this.load.html('fleetScalingPopup', 'assets/html/popups/fleetScalingPopup.html');
        this.load.html('fleetLocationsPopup', 'assets/html/popups/fleetLocationsPopup.html');
        this.load.html('fleetEventsPopup', 'assets/html/popups/fleetEventsPopup.html');
        this.load.html('gameSessionsTablePopup', 'assets/html/popups/gameSessionsTablePopup.html');
        this.load.html('matchmakingTicketHeadersTablePopup', 'assets/html/popups/matchmakingTicketHeadersTablePopup.html');
        this.load.html('ruleSetsPopup', 'assets/html/popups/ruleSetsPopup.html');
        this.load.html('flexMatchSimulatorPopup', 'assets/html/popups/flexMatchSimulatorPopup.html');
        this.load.html('queueSettingsPopup', 'assets/html/popups/queueSettingsPopup.html');
        this.load.html('virtualPlayerTasksPopup', 'assets/html/popups/virtualPlayerTasksPopup.html');
        this.load.html('matchmakingConfigPopup', 'assets/html/popups/matchmakingConfigPopup.html');
        this.load.html('queueEventsPopup', 'assets/html/popups/queueEventsPopup.html');

        // SUBPOPUPS
        Object.keys(SubPopups).map(key=>
        {
            this.load.html(SubPopups[key], 'assets/html/subpopups/' + SubPopups[key] + '.html');
        });

        // PAGES
        Object.keys(Pages).map(key=>
        {
            this.load.html(Pages[key], 'assets/html/pages/' + Pages[key] + '.html');
        });

        // FRAGMENTS
        this.load.html('scheduleProgress', 'assets/html/fragments/scheduleProgress.html');
        this.load.html('playerAttributeTemplate', 'assets/html/fragments/playerAttributeTemplate.html');
        this.load.html('playerLatencyPolicyTemplate', 'assets/html/fragments/playerLatencyPolicyTemplate.html');
        this.load.html('playerProfileTemplate', 'assets/html/fragments/playerProfileTemplate.html');
        this.load.html('regionLatencyTemplate', 'assets/html/fragments/regionLatencyTemplate.html');
    }

    preload ()
    {
        ScreenResolution.updateUserResolution(this.scale.width, this.scale.height);

        var width = ScreenResolution.width;
        var height = ScreenResolution.height;
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                color: '#000000',
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        var percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                color: '#000000',
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            percentText.setText(Math.ceil(value * 100) + '%' );
        });

        this.load.on('complete', function () {
            loadingText.destroy();
            percentText.destroy();
        });

        this.loadElements();

    }
};