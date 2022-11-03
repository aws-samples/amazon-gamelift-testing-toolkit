// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {EventDispatcher} from '../Events/EventDispatcher';
import {Events} from '../Events/Events';
import {DataTypes} from "../Data/DataTypes";
import MultipartMessage = DataTypes.MultipartMessage;
import {MultipartMessageHandler} from "./MultipartMessageHandler";
import { Signer } from '@aws-amplify/core';
import { Auth } from '@aws-amplify/auth';

export class Network
{
    protected static socket:WebSocket;
    protected static emitter:EventDispatcher;
    protected static messageHandler:MultipartMessageHandler;
    protected static tryToReconnect:boolean = true;
    protected static _url;
    protected static _intervalId;

    constructor()
    {
        Network.emitter = EventDispatcher.getInstance();
        Network.messageHandler = new MultipartMessageHandler();
    }

    public static connect (credentials, url:string) : Promise<boolean>
    {
        Network._url = url;

        return new Promise((resolve, reject)=>
        {
            const accessInfo = {
                access_key: credentials.accessKeyId,
                secret_key: credentials.secretAccessKey,
                session_token: credentials.sessionToken,
            }

            //Network.socket = new WebSocket(url + "?Auth=" + token);
            const signedUrl = Signer.signUrl(url, accessInfo)
            console.log(signedUrl);
            Network.socket = new WebSocket(signedUrl);
            Network.socket.onopen = (event:Event) =>
            {
                if (Network.tryToReconnect)
                {
                    // refresh token every hour
                    Network._intervalId = setInterval(Network.reconnectIfDisconnected, 3600000);
                }
                resolve(true);
                //Network.socket.send(JSON.stringify({"Type":"GetFleets"}));
            };

            Network.socket.onclose = (event:Event) =>
            {
                console.log("SOCKET CLOSED!");
                Network.reconnectIfDisconnected();
            }

            Network.socket.onerror = (event:Event) =>
            {
                reject(false);
            }

            Network.socket.onmessage = (event:MessageEvent) =>
            {
                const data = JSON.parse(event.data);
                if (data.Type=="MultipartMessage")
                {
                    const message = data as MultipartMessage;
                    this.messageHandler.addMessage(message);
                }
                else
                {
                    this.emitter.emit(Events.SOCKET_MESSAGE, data);
                }
            }

        });
    }

    public static disconnect()
    {
        Network.socket.close();
    }

    public static async reconnectIfDisconnected()
    {
        console.log("SOCKET STATE IS", Network.socket.readyState);

        try {
            const cognitoUser = await Auth.currentAuthenticatedUser();
            const currentSession = cognitoUser.signInUserSession;
            cognitoUser.refreshSession(currentSession.refreshToken, async (err, session) => {
                // do something with the new session
                console.log("REFRESHED SESSION", session);

                if ( Network.socket.readyState === 3 ) {
                    Network.socket.close();
                    console.log("TRYING TO RECONNECT!");
                    const credentials = await Auth.currentCredentials();
                    clearInterval(Network._intervalId);
                    Network.connect(credentials, Network._url);
                }
            });
        } catch (e) {
            console.log(e);

            await Auth.signOut();
            Auth.federatedSignIn();
        }
    }

    public static sendObject(obj:Object)
    {
        console.log("SENDING!", obj);
        Network.socket.send(JSON.stringify(obj));
    }

}
