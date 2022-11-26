// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Player, PlayerState, SceneDestination} from "./Player";
import {Players} from "./Players";
import {BaseContainer} from "./Abstract/BaseContainer";
import {RoundedRectangle} from "./RoundedRectangle";
import Timeline = Phaser.Tweens.Timeline;
import {PlayerMatches} from "./PlayerMatches";
import {ConsoleScene} from "../Scenes/ConsoleScene";
import {DataTypes} from "../Data/DataTypes";
import QueuePlacementEventDetail = DataTypes.QueuePlacementEventDetail;

export class PlayerMatchState {

    public static CREATED:string = "Created";
    public static WAITING_FOR_PLAYERS:string = "WaitingForPlayers";
    public static MOVING_TO_QUEUE:string = "MovingToQueue";
    public static READY_FOR_PLACEMENT:string = "ReadyForPlacement";
    public static MOVING_TO_INSTANCE:string = "MovingToInstance";
}

const parser = require('aws-arn-parser');

export class PlayerMatch extends BaseContainer
{
    protected _players: Record<string, Player>;
    protected _matchId: string;
    protected _creatorArn: string;
    protected _creatorType:string;
    protected _layoutRows = 3;
    protected _moving:boolean = false;
    protected _timeline:Timeline;
    protected _destinations: SceneDestination[];
    protected _destinationIndex = 0;
    protected _placementEvent: QueuePlacementEventDetail;
    protected _placementResources: string[];
    protected _state:string = PlayerMatchState.WAITING_FOR_PLAYERS;

    public static QUEUE_CREATOR="gamesessionqueue";
    public static MATCHMAKING_CREATOR="matchmakingconfiguration";

    protected _queueDestination: SceneDestination = null;
    protected _instanceDestination: SceneDestination = null;

    constructor (scene:Phaser.Scene, x:number, y:number, matchId:string, creatorArn:string)
    {
        super(scene, x, y);
        this._destinations = [];
        this._matchId = matchId;
        this._creatorArn = creatorArn;

        let arn = parser(creatorArn);
        if (arn.relativeId.indexOf("matchmakingconfiguration")==0)
        {
            this._creatorType = PlayerMatch.MATCHMAKING_CREATOR;
        }
        else if (arn.relativeId.indexOf("gamesessionqueue")==0)
        {
            this._creatorType = PlayerMatch.QUEUE_CREATOR;
        }
        else
        {
            this._creatorType="unknown";
        }

        this._players = {};
        this.setSize(16, 16);
        this.draw(16,16);
        this._bg.setVisible(false);
    }

    public set matchState(val:string)
    {
        this._state = val;
    }

    public get instanceDestination()
    {
        return this._instanceDestination;
    }

    public set instanceDestination(val:SceneDestination)
    {
        this._instanceDestination = val;
        if (this._state == PlayerMatchState.READY_FOR_PLACEMENT)
        {
            this._state = PlayerMatchState.MOVING_TO_INSTANCE;
            this.moveToDestination(this._instanceDestination);
        }
    }

    public set queueDestination(val:SceneDestination)
    {
        this._state = PlayerMatchState.MOVING_TO_QUEUE;
        this._queueDestination = val;
        this.moveToDestination(this._queueDestination);
    }

    public get queueDestination()
    {
        return this._queueDestination;
    }

    public get matchState()
    {
        return this._state;
    }

    handleOver = () =>
    {
        console.log("OVER MATCH!", this.matchId, this.playerIds);
        this.playerIds.map(playerId =>
        {
            Players.getPlayer(playerId).handleOver();
        });
    };

    public addPlayerToMatch(playerId)
    {
        if (PlayerMatches.getMatch(this.matchId)==undefined)
        {
            // this match has already been broken up!
            return false;
        }

        if (this._players[playerId]==undefined)
        {
            let player = Players.getPlayer(playerId);
            player.scale=0.75;
            player.playerState=PlayerState.IN_MATCH;
            this.add(player);

            this._elementGroup.add(player);
            player.resetDestinations();
            player.destroyTimeline();

            player.x = this._bg.x;
            player.y = this._bg.y;
            this.layoutContainer(0);
            this._players[playerId] = player;

            return true;
        }

        return false;

    }

    public breakUpMatch()
    {
        Object.keys(this._players).map(playerId=>
        {
            this.removePlayerFromMatch(playerId);
        });

        PlayerMatches.destroyMatch(this._matchId);
    }

    public addPlayersToMatch(playerIds)
    {
        playerIds.map(playerId=>
        {
            this.addPlayerToMatch(playerId);
        })
    }

    public removePlayerFromMatch(playerId)
    {
        if (this._players[playerId])
        {
            this._players[playerId].storeEvent("REMOVING PLAYER FROM MATCH " + this._matchId);
            Players.getPlayer(playerId).scale=1;
            Players.getPlayer(playerId).unparentInPlace();
            Players.getPlayer(playerId).playerState = PlayerState.WAITING_FOR_MATCH;
            delete this._players[playerId];
        }
    }

    public removePlayersFromMatch(playerIds)
    {
        playerIds.map(playerId=>
        {
            this.removePlayerFromMatch(playerId);
        })
    }

    public get matchId():string
    {
        return this._matchId;
    }

    public set placementEvent(eventDetail)
    {
        this._placementEvent=eventDetail;
    }

    public set placementResources(resources)
    {
        this._placementResources = resources;
    }

    public get placementEvent():QueuePlacementEventDetail
    {
        return this._placementEvent;
    }

    public get placementResources():string[]
    {
        return this._placementResources;
    }

    public get creatorArn():string
    {
        return this._creatorArn;
    }

    public get creatorType():string
    {
        return this._creatorType;
    }

    public set creatorArn(creatorArn)
    {
        this._creatorArn=creatorArn;
    }

    public get playerIds():string[]
    {
        return Object.keys(this._players);
    }

    public get players():Player[]
    {
        return Object.values(this._players);
    }

    public get ChildElements():Player[]
    {
        return Object.values(this._players);
    }

    draw(width:number, height:number)
    {
        this._bg?.destroy();
        this._bg = new RoundedRectangle(this.scene, 0, 0, width, height, 0x000000).setOrigin(0);
        this.addAt(this._bg, 0);
        this.setupEventListeners();
    }

    public handleClick(localX, localY)
    {
        /*
        if (this._fleetMenu.menuVisible==false)
        {
            this._emitter.emit(Events.CLOSE_MENUS);
            this._emitter.emit(Events.SHOW_FLEET_POPUP, new PopupClickEvent(this, localX, localY));
        }
        else
        {
            this._emitter.emit(Events.CLOSE_MENUS);
        }
         */
    }

    layoutContainer(padding:number=2)
    {
        this.setupEventListeners();

        if (this.ChildElements==null)
        {
            return;
        }

        let numElements:number = this.ChildElements.length;

        if (numElements==0)
        {
            return;
        }
        let firstElement = this.ChildElements[0];

        let groupChildren = this._elementGroup.getChildren();

        //let columns = Math.floor(this._bg.displayWidth/(firstElement.displayWidth+padding));
        let columns = Math.ceil(Math.sqrt(groupChildren.length));
        this._layoutRows = Math.ceil(Math.sqrt(groupChildren.length));

        let layoutOptions = {
            width: columns,
            height: this._layoutRows,
            position: Phaser.Display.Align.CENTER,
            cellWidth: firstElement.displayWidth+padding,
            cellHeight: firstElement.displayHeight+padding-2    ,
            x: this._groupOffsetX,
            y: this._groupOffsetY,
        };

        Phaser.Actions.GridAlign(groupChildren, layoutOptions);

        this._bg.destroy();
        let bounds = this.getBounds();
        this.draw(bounds.width, bounds.height);

        this._bg.x -= firstElement.displayWidth/2;
        this._bg.y -= firstElement.displayHeight/4;

        this._bg.setVisible(true);

    }

    public moveToDestination(destination:SceneDestination)
    {
        let destinationX = 0, destinationY = 0;

        if (destination.container!=null)
        {
            let tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
            let tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
            destination.container.getWorldTransformMatrix(tempMatrix, tempParentMatrix);
            var d = tempMatrix.decomposeMatrix();

            destinationX = d["translateX"] + this.displayWidth/2 + Phaser.Math.Between(0, destination.container.displayWidth - this.displayWidth);
            destinationY = d["translateY"] + destination.container.displayHeight/2 - this.displayHeight;
        }
        else
        {
            destinationX = destination.x;
            destinationY = destination.y;
        }

        this.moveToCoordinates(destinationX, destinationY, destination.disappearAfter, destination.delay, ()=>
        {
            if (destination.callback!=null)
            {
                destination.callback();
            }
        });
    }

    public showMatch()
    {
        this.visible=true;
    }

    public hideMatch()
    {
        this.visible=false;
    }

    public moveToCoordinates(destinationX:number, destinationY:number, disappearAfter:boolean=false, delay:number=0, callback:Function=null)
    {
        if (this._moving)
        {
            this._timeline?.stop();
            this._timeline?.destroy();
        }
        let xDistance=Math.abs(destinationX - this.x);
        let yDistance=Math.abs(destinationY - this.y);

        if (this.scene == undefined)
        {
            return;
        }
        this._timeline = this.scene.tweens.createTimeline();
        this._timeline.add({
            targets: this,
            x: destinationX,
            duration: Math.floor(xDistance*12/ConsoleScene.moveSpeed),
            delay: delay,
            onStart:()=>
            {
                this.playerIds.map((playerId)=>
                {
                    if (destinationX > this.x)
                    {
                        Players.getPlayer(playerId).playAnimation("right");
                    }
                    else
                    {
                        Players.getPlayer(playerId).playAnimation("left");
                    }
                })
            },
            onComplete: () =>
            {
                this.playerIds.map((playerId)=>
                {
                    if (destinationY > this.y)
                    {
                        Players.getPlayer(playerId).playAnimation("down");
                    }
                    else
                    {
                        Players.getPlayer(playerId).playAnimation("up");
                    }
                })
            }
        });

        this._timeline.add({
            targets: this,
            y: destinationY,
            duration: Math.floor(yDistance*12/ConsoleScene.moveSpeed),
            onComplete: ()=>
            {
                this._moving=false;
                this.playerIds.map((playerId)=>
                {
                    Players.getPlayer(playerId).playAnimation("down");
                    Players.getPlayer(playerId).stopAnimation();
                })

                if (callback)
                {
                    callback();
                }
            }
        });

        if (disappearAfter)
        {
            this._timeline.add({
                targets: this,
                alpha: 0,
                duration: 1000,
                onComplete: ()=>
                {
                    let playerIds = this.playerIds;
                    this.breakUpMatch();
                    playerIds.map((playerId)=>
                    {
                        Players.getPlayer(playerId).alpha=0;
                        Players.removePlayer(playerId);
                    });
                }
            });
        }

        this._timeline.play();
        this._moving=true;
    }

    public resetDestinations()
    {
        this._destinations=[];
        this._destinationIndex = 0;
    }
}