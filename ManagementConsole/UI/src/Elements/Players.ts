// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../Data/DataTypes";
import {Player} from "./Player";
import config from "../Config/Config";
import Rectangle = Phaser.GameObjects.Rectangle;
import {Instance} from "./Instance";

export class Players
{
    protected static _players: Record<string, Player>;

    public static hidePlayers()
    {
        Players.getPlayers()?.map(player => player.visible=false);
    }

    public static showPlayers()
    {
        Players.getPlayers()?.map(player => player.visible=true);
    }

    public static addPlayer(player:Player)
    {
        if (Players._players==null)
        {
            Players._players = {};
        }

        Players._players[player.PlayerId] = player;
    }

    public static removePlayer(playerId:string)
    {
        if (Players._players==null)
        {
            Players._players = {};
        }

        if (Players._players[playerId])
        {
            Players._players[playerId].destroy();
            delete Players._players[playerId];
        }
    }

    public static getPlayer(playerId):Player
    {
        if (Players._players==null)
        {
            Players._players = {};
        }
        return Players._players[playerId];
    }

    public static getPlayers():Player[]
    {
        if (this._players==null)
            return new Array<Player>();

        return Object.values(this._players);
    }

    public static getAddedPlayers():Player[]
    {
        return Players.getPlayers().filter(player=>player.added);
    }

    public static playerOverlaps(player:Player)
    {
        let overlaps:boolean = false;
        Players.getAddedPlayers().map((currentPlayer)=>
        {
            //console.log(player.getBounds());
            //console.log(currentPlayer.getBounds());
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), currentPlayer.getBounds()))
            {
                //console.log("OVERLAPS!");
                overlaps = true;
                return true;
            }
        });

        if (!overlaps)
        {
            //console.log("DOESN'T OVERLAP!");
        }
        return overlaps;
    }

    public static setClearXPos(player:Player, min:number, max:number)
    {
        let maxAttempts=20;
        let attempts=0;
        while (Players.playerOverlaps(player))
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
