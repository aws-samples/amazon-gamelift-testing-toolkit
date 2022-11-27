// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {PlayerMatch} from "../Elements/PlayerMatch";
import {ConsoleScene} from "../Scenes/ConsoleScene";
import Rectangle = Phaser.Geom.Rectangle;
import {PlayerManager} from "./PlayerManager";
import {ScreenResolution} from "../Data/ScreenResolution";
import {Game} from "../Game";
import TextureManager = Phaser.Textures.TextureManager;
import {Player} from "../Elements/Player";

export class MatchManager
{
    public static _matches: Record<string, PlayerMatch> = {};
    protected static _matchAreas: Record<string, Rectangle> = {};

    public static getMatch(matchId):PlayerMatch
    {
        if (MatchManager._matches==null)
        {
            MatchManager._matches = {};
        }
        return MatchManager._matches[matchId];
    }

    public static createMatch(scene:Phaser.Scene, matchId:string, configArn:string=null):PlayerMatch
    {
        if (MatchManager._matches==null)
        {
            MatchManager._matches = {};
        }

        if (MatchManager._matches[matchId]==undefined)
        {
            MatchManager._matches[matchId] = new PlayerMatch(scene, 0, 0, matchId, configArn);
            if (ConsoleScene.animationsEnabled==false)
            {
                MatchManager._matches[matchId].visible=false;
            }
        }

        return MatchManager._matches[matchId];
    }

    public static hideMatches()
    {
        let matches = Object.values(MatchManager._matches);
        matches?.map(match => match.hideMatch());
    }

    public static showMatches()
    {
        let matches = Object.values(MatchManager._matches);
        matches?.map(match => match.showMatch());
    }

    public static destroyMatch(matchId:string)
    {
        if (MatchManager._matches[matchId])
        {
            MatchManager.deleteMatchPosition(matchId);
            MatchManager._matches[matchId].destroy();
            delete MatchManager._matches[matchId];
        }
    }

    public static findPlayerMatch(playerId:string):PlayerMatch
    {
        let foundMatch=null;

        this.getMatches().map(playerMatch =>
        {
            if (playerMatch.playerIds.indexOf(playerId)!==-1)
            {
                foundMatch=playerMatch;
            }
        });

        return foundMatch;
    }

    public static getMatches():PlayerMatch[]
    {
        if (this._matches==null)
            return new Array<PlayerMatch>();

        return Object.values(this._matches);
    }

    public static addMatch(match:PlayerMatch)
    {
        if (MatchManager._matches==null)
        {
            MatchManager._matches = {};
        }

        MatchManager._matches[match.matchId] = match;
    }

    protected static matchOverlaps(bounds:Rectangle):boolean
    {
        let overlaps=false;

        Object.values(this._matchAreas).map( existingMatch =>
        {
            if (Phaser.Geom.Intersects.RectangleToRectangle(bounds, existingMatch))
            {
                overlaps = true;
                return;
            }
        });
        return overlaps;
    }

    public static createMatchPosition(match:PlayerMatch, containerPosition:Rectangle, containerArn:string, numPlayers:number)
    {
        let player = PlayerManager.getPlayer("sampleplayer");
        if (player==null)
        {
            player = new Player(ConsoleScene.getInstance(), -300, -300, "sampleplayer");
        }
        player.scale=0.75;

        const matchDims = match.getExpectedMatchDims(player, numPlayers);
        const halfWidth = Math.round(matchDims.width/2);
        const halfHeight = Math.round(matchDims.height/2);

        let xPos=0;
        let yPos=0;
        let positions=[];
        for (let tmpY=(containerPosition.y + containerPosition.height - halfHeight); tmpY > (containerPosition.y + halfHeight); tmpY-=matchDims.height+2)
        {
            let origTmpX = containerPosition.x + Math.round( containerPosition.width/2);
            let tmpX = origTmpX;
            let maxLeftX  = (containerPosition.x + halfWidth);
            let maxRightX = (containerPosition.x + containerPosition.width - halfWidth);
            let leftCount=0;
            let rightCount=0;
            while (tmpX >= maxLeftX && tmpX <= maxRightX)
            {
                positions.push(new Rectangle(tmpX, tmpY, matchDims.width, matchDims.height));
                if (leftCount<=rightCount)
                {
                    leftCount++;
                    tmpX = origTmpX - leftCount * (matchDims.width+2);
                }
                else
                {
                    rightCount++;
                    tmpX = origTmpX + rightCount * (matchDims.width+2);
                }
            }
        }

        for (let i=0; i<positions.length; i++)
        {
            if (!this.matchOverlaps(positions[i]))
            {
                xPos = positions[i].x;
                yPos = positions[i].y;
                break;
            }
        }
        if (xPos == 0 && yPos==0) // no clear position so pick any old spot
        {
            xPos = Phaser.Math.Between(containerPosition.x + halfWidth, containerPosition.x + containerPosition.width - halfWidth);
            yPos = Phaser.Math.Between(containerPosition.y + halfHeight, containerPosition.y + containerPosition.height - halfHeight);
        }

        this._matchAreas[match.matchId] = new Rectangle(xPos, yPos, matchDims.width, matchDims.height);

        return {
            x: xPos,
            y: yPos,
        }
    }

    public static deleteMatchPosition(matchId:string)
    {
        if (this._matchAreas[matchId]!=undefined)
        {
            delete this._matchAreas[matchId];
        }
    }

    public static initializeMatch = (matchId:string, creatorArn:string, expectedPlayers:number):PlayerMatch =>
    {
        let match = MatchManager.getMatch(matchId);

        const consoleScene = ConsoleScene.getInstance();
        // if match doesn't exist yet, then create it
        if (match==undefined)
        {
            match = MatchManager.createMatch(consoleScene, matchId, creatorArn);
            consoleScene.add.existing(match);
            //match.creatorArn = creatorArn;

            // config Arn is set, then update match
            if (creatorArn!=null)
            {
                if (match.creatorType == PlayerMatch.MATCHMAKING_CREATOR)
                {
                    let matchmakingConfig = consoleScene.getMatchmakingConfigurations().getConfigByArn(creatorArn);
                    match.x = matchmakingConfig.x + Math.floor(Math.random() * matchmakingConfig.displayWidth);
                    let d = matchmakingConfig.getWorldTranslation();
                    let containerPosition:Rectangle = new Rectangle(d["translateX"], d["translateY"], matchmakingConfig.displayWidth, matchmakingConfig.displayHeight);
                    const matchPos = this.createMatchPosition(match, containerPosition, creatorArn, expectedPlayers);

                    match.x = matchPos.x;
                    match.y = matchPos.y;
                }
                else
                if (match.creatorType == PlayerMatch.QUEUE_CREATOR)
                {
                    let queue = consoleScene.getQueues().getQueueByArn(creatorArn);
                    let d = queue.getWorldTranslation();
                    let containerPosition:Rectangle = new Rectangle(d["translateX"], d["translateY"], queue.displayWidth, queue.displayHeight);
                    const matchPos = this.createMatchPosition(match, containerPosition, creatorArn, expectedPlayers);
                    match.x = matchPos.x;
                    match.y = matchPos.y;

                    /*match.x = queue.x + Math.floor(Math.random() * queue.displayWidth);

                    if (ScreenResolution.displayResolution==ScreenResolution.RES_720P)
                    {
                        match.y = 320;
                    }
                    else
                    {
                        match.y = 450;
                    }*/
                }

            }
        }

        return match;
    }

}
