// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {EventDispatcher} from "../Events/EventDispatcher";
import {Events} from "../Events/Events";
import {PopupClickEvent} from "./../Events/PopupClickEvent";
import Container = Phaser.GameObjects.Container;
import Timeline = Phaser.Tweens.Timeline;
import {ConsoleScene} from "../Scenes/ConsoleScene";
import {PlayerSprite} from "./PlayerSprite";
import {Players} from "./Players";

export class SceneDestination
{
    public container?:Container;
    public type:string;
    public x?:number;
    public y?:number;
    public disappearAfter?: boolean = false;
    public delay?: number = 0;
    public callback?: Function;
}

export class PlayerState
{
    public static CREATED:string = "Created";
    public static WAITING_FOR_MATCH:string = "WaitingForMatch";
    public static WALKING_TO_MATCH:string = "WalkingToMatch";
    public static IN_MATCH:string = "InMatch";
    public static RESET:string = "Reset";
}

export class Player extends Container
{
    protected _playerId:string;
    protected _ticketId:string;
    public added:boolean = false;
    protected _emitter:EventDispatcher;
    public initialX:number;
    public initialY:number;
    protected _moving:boolean = false;
    protected _timeline:Timeline;
    protected _destinations: SceneDestination[];
    protected _destinationIndex = 0;
    protected _sprite:PlayerSprite;
    protected _eventHistory: any[];
    protected _state: string;
    protected _lastSeen: number;

    constructor (scene:Phaser.Scene, x:number, y:number, playerId:string=null)
    {
        super(scene, x, y);

        this._destinations = [];
        this._emitter = EventDispatcher.getInstance();
        this._playerId = playerId;
        this._eventHistory = [];
        this.playerState = PlayerState.CREATED;

        if (ConsoleScene.animationsEnabled==false)
        {
            this.visible=false;
        }

        console.log("CONSTRUCTING NEW PLAYER", this._playerId);

        this._sprite = PlayerSprite.Random(scene);
        this.add(this._sprite);
        this._sprite._emitter.on(Events.OVER_PLAYER, this.handleOver);
        this.setSize(this._sprite.width, this._sprite.height);

        this.setInteractive().on("pointerdown", this.onMouseDown);
        this.setInteractive().on("pointerover", this.handleOver);
    }

    public storeEvent(event)
    {
        this._eventHistory.push(event);
    }

    public get PlayerId()
    {
        return this._playerId;
    }

    public set activeTicketId(ticketId:string)
    {
        this._ticketId = ticketId;
    }

    public get activeTicketId()
    {
        return this._ticketId;
    }

    public set playerState(state:string)
    {
        this._lastSeen = Date.now();
        this._state = state;
    }

    public get playerState()
    {
        return this._state;
    }

    public get lastSeen ()
    {
        return this._lastSeen;
    }

    public addedToScene() {
        super.addedToScene();
        this.added=true;
    }

    /*public removedFromScene() {
        super.removedFromScene();
        this.added=false;
    }*/

    public onMouseDown = (pointer, localX, localY, event)=>
    {
        this._emitter.emit(Events.SHOW_PLAYER_POPUP, new PopupClickEvent(this, localX, localY));
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
            destinationY = d["translateY"] + destination.container.displayHeight/2;
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
            this.moveToNextDestination();
        });
    }

    public getNextDestination():SceneDestination
    {
        if (this._destinations.length >= this._destinationIndex + 1)
        {
            return this._destinations[this._destinationIndex];
        }

        return null;
    }

    public resetPlayer()
    {
        this.playerState = PlayerState.RESET;
        this.moveToInitialPosition();
        this.resetDestinations();
    }

    public resetDestinations()
    {
        this._destinations=[];
        this._destinationIndex = 0;
    }

    public moveToInitialPosition()
    {
        this.moveToCoordinates(this.initialX, this.initialY, false, 0, null);
    }

    public addDestination(destination: SceneDestination)
    {
        console.log("ADDING DESTINATION TO PLAYER " + this._playerId, destination, this.playerState);
        this._destinations.push(destination);

        if (!this._moving)
        {
            this.moveToNextDestination();
        }
    }

    public moveToNextDestination()
    {
        let nextDestination = this.getNextDestination();
        if (nextDestination!=null)
        {
            this._destinationIndex++;
            this.moveToDestination(nextDestination);
        }
    }

    public destroyTimeline()
    {
        if (this._moving)
        {
            this._timeline?.stop();
            this._timeline?.destroy();
        }
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

        this._timeline = this.scene.tweens.createTimeline();
        this._timeline.add({
            targets: this,
            x: destinationX,
            // original speed was xDistance * 4, so moveSpeed = 3 = original speed
            duration: Math.floor(xDistance*12/ConsoleScene.moveSpeed),
            delay: delay,
            onStart:()=>
            {
                if (destinationX > this.x)
                {
                    this._sprite.play("right");
                }
                else
                {
                    this._sprite.play("left");
                }
            },
            onComplete: () =>
            {
                if (destinationY > this.y)
                {
                    this._sprite.play("down");
                }
                else
                {
                    this._sprite.play("up");
                }
            }
        });

        this._timeline.add({
            targets: this,
            y: destinationY,
            duration: Math.floor(yDistance*12/ConsoleScene.moveSpeed),
            onComplete: ()=>
            {
                this._moving=false;
                this._sprite.play("down");
                this._sprite.stop();
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
                    this._emitter.emit(Events.PLAYER_ADDED_TO_GAME_SESSION, this._playerId);
                }
            });
        }

        this._timeline.play();
        this._moving=true;
    }

    playAnimation(key:string)
    {
        this._sprite.play(key);
    }

    stopAnimation()
    {
        this._sprite.stop();
    }

    unparentInPlace()
    {
        if (this.parentContainer)
        {
            let translation = this.getWorldTranslation();
            this.parentContainer.remove(this);
            this.x = translation["translateX"];
            this.y = translation["translateY"];
        }
    }

    getWorldTranslation()
    {
        let tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        let tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.getWorldTransformMatrix(tempMatrix, tempParentMatrix);
        var d = tempMatrix.decomposeMatrix();
        return d;
    }

    handleOver = () =>
    {
        console.log("OVER PLAYER", this._playerId, this._eventHistory);
    };
}