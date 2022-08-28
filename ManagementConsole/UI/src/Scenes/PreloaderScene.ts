// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {ScreenResolution} from "../Data/ScreenResolution";

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
        this.load.multiatlas("toolkit", "assets/textures.json", "assets");
        this.load.bitmapFont('Noto Sans', 'assets/webfonts/Noto Sans.png', 'assets/webfonts/Noto Sans.fnt');
        this.load.html('tokenForm', 'assets/html/tokenForm.html');
        this.load.html('simpleJsonPopup', 'assets/html/simpleJsonPopup.html');
        this.load.html('simpleGraphPopup', 'assets/html/simpleGraphPopup.html');
        this.load.html('fleetScalingPopup', 'assets/html/fleetScalingPopup.html');
        this.load.html('fleetLocationsPopup', 'assets/html/fleetLocationsPopup.html');
        this.load.html('fleetEventsPopup', 'assets/html/fleetEventsPopup.html');
        this.load.html('gameSessionsTablePopup', 'assets/html/gameSessionsTablePopup.html');
        this.load.html('launchVirtualPlayersPopup', 'assets/html/launchVirtualPlayersPopup.html');
        this.load.html('virtualPlayersTablePopup', 'assets/html/virtualPlayersTablePopup.html');
        this.load.html('matchmakingTicketHeadersTablePopup', 'assets/html/matchmakingTicketHeadersTablePopup.html');
        this.load.html('gameSessionPopup', 'assets/html/gameSessionPopup.html');
        this.load.html('ruleSetsPopup', 'assets/html/ruleSetsPopup.html');
        this.load.html('flexMatchSimulatorPopup', 'assets/html/flexMatchSimulatorPopup.html');
        this.load.html('matchmakingConfigPopup', 'assets/html/matchmakingConfigPopup.html');
        this.load.html('queueEventsPopup', 'assets/html/queueEventsPopup.html');
        this.load.html('settings', 'assets/html/settings.html');
        this.load.html('launchPlayers', 'assets/html/launchPlayers.html');
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