// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import DOMElement = Phaser.GameObjects.DOMElement;
import {Network} from "../../Network/Network";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import {SettingsForm} from "./SettingsForm";
import { Auth } from '@aws-amplify/auth';
import {Game} from "../../Game";

export class SettingsPanel extends Phaser.GameObjects.Container
{
    protected _settingsPanel: DOMElement;
    protected _form:SettingsForm;
    protected _emitter: EventDispatcher;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._emitter = EventDispatcher.getInstance();
        this._settingsPanel = this.scene.add.dom(0, 0).createFromCache('settings');
        this.add(this._settingsPanel);
        this._settingsPanel.setOrigin(0,0);
        this._settingsPanel.y=5;
        this._settingsPanel.setPerspective(600);
        this._settingsPanel.addListener("mousedown");

        this._settingsPanel.on('mousedown', this.onSettingsClick);
        this.setVisible(false);

    }

    create()
    {

    }

    show()
    {
        if (Game.debugMode)
        {
            $('.testMenu').show();
        }
        else {
            $('.testMenu').hide();
        }

        this.setVisible(true);
        this.x=-this._settingsPanel.displayWidth
        this.scene.tweens.add({
            targets: this,
            x: 0,
            duration: 500,
            ease: 'Power3'
        });

    }

    hide()
    {
        this.hideForm();
        this.x=0;
        this.scene.tweens.add({
            targets: this,
            x: -this._settingsPanel.displayWidth,
            duration: 500,
            ease: 'Power3'
        });
    }

    onSettingsClick = async (event) => {

        event.stopPropagation();

        switch (event.target.className)
        {
            case "closeButton":
                this._emitter.emit(Events.CLOSE_SETTINGS);
                break;

            case "launchPlayers":
                this._emitter.emit(Events.CLOSE_SETTINGS);
                this._emitter.emit(Events.SHOW_LAUNCH_VIRTUAL_PLAYERS_POPUP);
                break;

            case "flexmatchSimulator":
                this._emitter.emit(Events.SHOW_FLEXMATCH_SIMULATOR_POPUP);
                this._emitter.emit(Events.CLOSE_SETTINGS);
                break;

            case "socketClose":
                Network.disconnect();
                break;

            case "manageVirtualPlayers":
                this._emitter.emit(Events.SHOW_MANAGE_VIRTUAL_PLAYERS_POPUP);
                this._emitter.emit(Events.CLOSE_SETTINGS);
                break;

            case "manageMatchmakingRulesets":
                this._emitter.emit(Events.SHOW_MATCHMAKING_RULESETS_POPUP);
                this._emitter.emit(Events.CLOSE_SETTINGS);
                break;

            case "logout":
                await Auth.signOut();
                Auth.federatedSignIn();
                break;

            case "addFakeFleet":
                this._emitter.emit(Events.ADD_DUMMY_FLEET);
                break;

            case "addFakePlayer":
                this._emitter.emit(Events.ADD_DUMMY_PLAYER);
                break;

            case "addFakeMatch":
                this._emitter.emit(Events.ADD_DUMMY_MATCH);
                break;

            case "addFakePlayerToMatch":
                this._emitter.emit(Events.ADD_DUMMY_PLAYER_TO_MATCH);
                break;

            case "addFakeInstance":
                this._emitter.emit(Events.ADD_DUMMY_INSTANCE);
                break;

            case "addFakeMatchmakingConfig":
                this._emitter.emit(Events.ADD_DUMMY_MATCHMAKING_CONFIG);
                break;

            case "addFakeQueue":
                this._emitter.emit(Events.ADD_DUMMY_QUEUE);
                break;

            case "addFakeAnimations":
                this._emitter.emit(Events.ADD_DUMMY_ANIMATIONS);
                break;
        }
    }

    hideForm = () =>
    {
        this._form?.destroy();
    };

    showForm = (form) =>
    {
        this._form?.destroy();
        //this._form = new form();
        this._form = form;
        this.add(this._form);
        this._form.show();
    };


}