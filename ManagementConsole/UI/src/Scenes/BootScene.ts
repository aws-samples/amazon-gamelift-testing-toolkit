// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Utils} from "../Utils/Utils";
import { getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { Hub } from 'aws-amplify/utils';

export class BootScene extends Phaser.Scene {
    constructor () {
        super('Boot');
    }

    preload () {
        this.load.json('configJson', 'Config.json');

    }

    async create () {
        let configObj = this.game.cache.json.get("configJson");

        // Amplify v6 config shape: everything is nested under `Auth.Cognito`. The v4
        // fields (`userPoolWebClientId`, top-level `region`, flat `oauth`, scalar
        // redirect URLs, `scope`) have been renamed / restructured. Region is now
        // inferred from the user pool ID prefix, so no explicit `region` is needed.
        const redirectUrl = window.location.protocol + "//" + window.location.host;
        Amplify.configure({
            Auth: {
                Cognito: {
                    userPoolId: configObj["UserPoolId"],
                    userPoolClientId: configObj["AppClientId"],
                    identityPoolId: configObj["IdentityPoolId"],
                    loginWith: {
                        oauth: {
                            domain: configObj["CognitoDomain"],
                            scopes: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
                            redirectSignIn: [redirectUrl],
                            redirectSignOut: [redirectUrl],
                            // REFRESH token is only issued when responseType is 'code'.
                            responseType: 'code',
                        },
                    },
                },
            },
        });

        // Amplify v6 behavioural change vs v4: `signInWithRedirect()` now throws
        // `UserAlreadyAuthenticatedException` if a session already exists in
        // storage. And Amplify auto-handles the ?code=... exchange via its
        // internal OAuth listener, so we must not kick off a new redirect
        // while one is in flight. Three cases to handle:
        //   (a) No session, no ?code=  -> start Hosted UI redirect.
        //   (b) ?code= present         -> Amplify is exchanging the code; wait
        //                                 for the `signInWithRedirect` Hub event
        //                                 (fallback: poll getCurrentUser).
        //   (c) Session already cached -> skip redirect, go straight through.
        const code = Utils.getParameterByName("code");

        try
        {
            await getCurrentUser();
            // Case (c): already signed in.
            this.scene.start('Preloader');
            return;
        }
        catch
        {
            // No cached user yet.
        }

        if (code != null)
        {
            // Case (b): returning from Hosted UI. Amplify's internal listener
            // will complete the code->token exchange and dispatch a
            // `signInWithRedirect` event on the `auth` Hub channel.
            const unsubscribe = Hub.listen('auth', ({ payload }) => {
                switch (payload.event)
                {
                    case 'signInWithRedirect':
                        unsubscribe();
                        this.scene.start('Preloader');
                        break;
                    case 'signInWithRedirect_failure':
                        unsubscribe();
                        // Fallback: restart Hosted UI on failure.
                        signInWithRedirect();
                        break;
                }
            });
            return;
        }

        // Case (a): fresh load with no session -> start Hosted UI.
        signInWithRedirect();
    }
}
