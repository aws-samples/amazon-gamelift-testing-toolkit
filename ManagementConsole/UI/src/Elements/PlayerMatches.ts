// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {PlayerMatch} from "./PlayerMatch";
import {ConsoleScene} from "../Scenes/ConsoleScene";

export class PlayerMatches
{
    public static _matches: Record<string, PlayerMatch> = {};

    public static getMatch(matchId):PlayerMatch
    {
        if (PlayerMatches._matches==null)
        {
            PlayerMatches._matches = {};
        }
        return PlayerMatches._matches[matchId];
    }

    public static createMatch(scene:Phaser.Scene, matchId:string, configArn:string=null):PlayerMatch
    {
        if (PlayerMatches._matches==null)
        {
            PlayerMatches._matches = {};
        }

        if (PlayerMatches._matches[matchId]==undefined)
        {
            PlayerMatches._matches[matchId] = new PlayerMatch(scene, 0, 0, matchId, configArn);
            if (ConsoleScene.animationsEnabled==false)
            {
                PlayerMatches._matches[matchId].visible=false;
            }
        }

        return PlayerMatches._matches[matchId];
    }

    public static hideMatches()
    {
        let matches = Object.values(PlayerMatches._matches);
        matches?.map(match => match.hideMatch());
    }

    public static showMatches()
    {
        let matches = Object.values(PlayerMatches._matches);
        matches?.map(match => match.showMatch());
    }

    public static destroyMatch(matchId:string)
    {
        if (PlayerMatches._matches[matchId])
        {
            PlayerMatches._matches[matchId].destroy();
            delete PlayerMatches._matches[matchId];
        }
    }

    public static findPlayerMatch(playerId:string):PlayerMatch
    {
        this.getMatches().map(playerMatch =>
        {
            if (playerMatch.playerIds.indexOf(playerId)!==-1)
            {
                return playerMatch;
            }
        });

        return null;
    }

    public static getMatches():PlayerMatch[]
    {
        if (this._matches==null)
            return new Array<PlayerMatch>();

        return Object.values(this._matches);
    }

    public static addMatch(match:PlayerMatch)
    {
        if (PlayerMatches._matches==null)
        {
            PlayerMatches._matches = {};
        }

        PlayerMatches._matches[match.matchId] = match;
    }
}
