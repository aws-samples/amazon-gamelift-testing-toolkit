// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Player} from "../Elements/Player";

export class PlayerManager
{
    protected static _players: Record<string, Player>;

    public static hidePlayers()
    {
        PlayerManager.getPlayers()?.map(player => player.hidePlayer());
    }

    public static showPlayers()
    {
        PlayerManager.getPlayers()?.map(player => player.showPlayer());
    }

    public static addPlayer(player:Player)
    {
        if (PlayerManager._players==null)
        {
            PlayerManager._players = {};
        }

        PlayerManager._players[player.PlayerId] = player;
    }

    public static removePlayer(playerId:string)
    {
        if (PlayerManager._players==null)
        {
            PlayerManager._players = {};
        }

        if (PlayerManager._players[playerId])
        {
            PlayerManager._players[playerId].destroyTimeline();
            PlayerManager._players[playerId].destroy();
            delete PlayerManager._players[playerId];
        }
    }

    public static getPlayer(playerId):Player
    {
        if (PlayerManager._players==null)
        {
            PlayerManager._players = {};
        }
        return PlayerManager._players[playerId];
    }

    public static getPlayers():Player[]
    {
        if (this._players==null)
            return new Array<Player>();

        return Object.values(this._players);
    }

    public static getAddedPlayers():Player[]
    {
        return PlayerManager.getPlayers().filter(player=>player.added);
    }

    public static playerOverlaps(player:Player)
    {
        let overlaps:boolean = false;
        PlayerManager.getAddedPlayers().map((currentPlayer)=>
        {
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), currentPlayer.getBounds()))
            {
                overlaps = true;
                return true;
            }
        });

        if (!overlaps)
        {
        }
        return overlaps;
    }

    public static setClearXPos(player:Player, min:number, max:number)
    {
        let maxAttempts=20;
        let attempts=0;
        while (PlayerManager.playerOverlaps(player))
        {
            let xPos = Phaser.Math.Between(min, max);
            player.x = xPos;
            attempts++;
            if (attempts>=20)
            {
                break;
            }
        }
    }

}
