// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {Game} from '../Game'
import {Network} from '../Network/Network'
import DOMElement = Phaser.GameObjects.DOMElement;
import {DataTypes} from "../Data/DataTypes";
import {EventDispatcher} from '../Events/EventDispatcher';
import {Events} from '../Events/Events';
import StateMessage = DataTypes.StateMessage;
import { Auth } from '@aws-amplify/auth';

export class LoginScene extends Phaser.Scene
{
    protected _loginElement : DOMElement;
    protected _emitter:EventDispatcher;

    constructor ()
    {
        super("Login");
    }

    create ()
    {
        this.cameras.main.setBackgroundColor("#ffffff");
        this._loginElement = this.add.dom(640, 360).createFromCache('tokenForm');
        this._loginElement.setPerspective(800);

        this._loginElement.addListener("click");
        this._loginElement.on('click', this.onLoginClick);

        this._loginElement.alpha = 0;
        this.tweens.add({
            targets: this._loginElement,
            alpha: 1,
            duration: 1000,
            ease: 'Power3'
        });

        this._emitter = EventDispatcher.getInstance();
        Auth.currentSession().then(res=>{
            let accessToken = res.getAccessToken()
            let jwt = accessToken.getJwtToken()
            //You can print them to see the full objects
            console.log(`myAccessToken: ${JSON.stringify(accessToken)}`)
            console.log(`myJwt: ${jwt}`);
            this.doLogin();
        })
    }

    doLogin = async() =>
    {
        Auth.currentSession().then(async (res) => {
            let accessToken = res.getAccessToken();
            let jwt = accessToken.getJwtToken();

            try {
                let configObj = this.game.cache.json.get("configJson");
                console.log(configObj);
                this._loginElement.getChildByID('helpText').innerHTML = "Connecting...";
                //await Network.connect(inputToken["value"], configObj["ApiUrl"]);
                try {
                    const credentials = await Auth.currentCredentials();
                    console.log(credentials);
                    console.log("PAH");
                    await Network.connect(credentials, configObj["ApiUrl"]);
                    this._emitter.once(Events.SOCKET_MESSAGE, (data: any) => {
                        console.log(data);
                        let stateMessage: StateMessage = data as StateMessage;
                        this.scene.start('Console', stateMessage.State);
                    })
                    Network.sendObject({"Type": "GetState"});
                }
                catch (e:any)
                {
                    console.log(e);
                }

            } catch (error: any) {
                this._loginElement.getChildByID("loginForm").className = "";
                this._loginElement.getChildByID('helpText').innerHTML = "Please enter your token below:-";
                this._loginElement.getChildByID('errorText').className = "errorText";
                this._loginElement.getChildByID('helpText').className = "hide";
                this._loginElement.addListener("click");

                this.time.addEvent({
                    delay: 2000, callbackScope: this, callback: () => {
                        this._loginElement.getChildByID('helpText').className = "";
                        this._loginElement.getChildByID('errorText').className = "errorText hide";
                    }
                });
            }
        });
    }

    onLoginClick = async (event) => {
        if (event.target.name === 'loginButton')
        {
           this.doLogin();
        }
    };
}