// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Utils} from "../Utils/Utils";
import { Auth } from '@aws-amplify/auth';
import Amplify from '@aws-amplify/core';

export class BootScene extends Phaser.Scene {
    constructor () {
        super('Boot');
    }

    preload () {
        this.load.json('configJson', 'Config.json');

    }

    async create () {
        let configObj = this.game.cache.json.get("configJson");

        Amplify.configure({
            Auth: {

                // REQUIRED - Amazon Cognito Region
                region: configObj["Region"],

                // OPTIONAL - Amazon Cognito User Pool ID
                userPoolId: configObj["UserPoolId"],

                // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
                userPoolWebClientId: configObj["AppClientId"],

                // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
                identityPoolId: configObj["IdentityPoolId"],

                // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
                //authenticationFlowType: 'USER_PASSWORD_AUTH',

                // OPTIONAL - Hosted UI configuration
                oauth: {
                    domain: configObj["CognitoDomain"],
                    scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
                    redirectSignIn: window.location.protocol + "//" + window.location.host,
                    redirectSignOut: window.location.protocol  + "//" + window.location.host,
                    responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
                }
            }
        });

        const code = Utils.getParameterByName("code");
        if (code==null)
        {
            Auth.federatedSignIn();
            return;
        }
        else
        {
            await Auth.currentAuthenticatedUser();
            this.scene.start('Preloader');
        }
    }
}