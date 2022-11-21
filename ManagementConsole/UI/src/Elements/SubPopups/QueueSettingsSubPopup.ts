// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {SubPopup} from "../Abstract/SubPopup";
import GameSessionQueue = DataTypes.GameSessionQueue;
import {Game} from "../../Game";

export class QueueSettingsSubPopup extends SubPopup
{
    protected _queue:GameSessionQueue;

    public constructor (cacheKey:string, parentDomId:string, gameSessionQueue:GameSessionQueue)
    {
        super(cacheKey, parentDomId);
        this._queue = gameSessionQueue;
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetGameSessionQueue", QueueArn:this._queue.GameSessionQueueArn});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_GAME_SESSION_QUEUE, this.onGetGameSessionQueueResponse);
        this._emitter.on(Events.UPDATE_GAME_SESSION_QUEUE_RESPONSE, this.onUpdateGameSessionQueueResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_GAME_SESSION_QUEUE, this.onGetGameSessionQueueResponse);
        this._emitter.off(Events.UPDATE_GAME_SESSION_QUEUE_RESPONSE, this.onUpdateGameSessionQueueResponse);
    }

    onGetGameSessionQueueResponse = (data) =>
    {
        this._queue = data.GameSessionQueue as GameSessionQueue;
        this.updateForm();
    }

    updateForm = () =>
    {
        this.resetElement(".queueSettingsContent");
        this.addPlayerLatencyPolicies(this._queue.PlayerLatencyPolicies);
        $('#' + this._parentDomId).find(".queueSettingsForm #timeoutInSeconds").val(this._queue.TimeoutInSeconds);
    }

    onUpdateGameSessionQueueResponse = (data) =>
    {
        if (data.Updated)
        {
            this.showSuccessAlert("Queue updated successfully");
            this._queue = data.UpdatedQueue;
            this.updateForm();
        }
        else
        {
            this.showFailureAlert("Error: " + data.ErrorMessage);
        }
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (el.hasClass("updateQueueSettings"))
        {
            const timeout = parseInt($('#' + this._parentDomId).find(".queueSettingsForm #timeoutInSeconds").val() as string);
            const policies = this.getPlayerLatencyPolicyValues();
            // TODO - reinstate once removal issue resolved
            // Network.sendObject({Type: "UpdateQueueSettings", QueueArn:this._queue.GameSessionQueueArn, TimeoutInSeconds: timeout, PlayerLatencyPolicies:policies});
            Network.sendObject({Type: "UpdateQueueSettings", QueueArn:this._queue.GameSessionQueueArn, TimeoutInSeconds: timeout});
        }

        if (el.hasClass('addPlayerLatencyPolicy'))
        {
            this.addNewPlayerLatencyPolicy();
        }

        if (el.hasClass('removePlayerLatencyPolicy'))
        {
            this.removePlayerLatencyPolicy(el);
        }
    }

    addNewPlayerLatencyPolicy()
    {
        const html = Game.game.cache.html.get("playerLatencyPolicyTemplate");

        let addedEl = $(html).appendTo("#playerLatencyPolicies");
        addedEl.find('.periodEnd').on("input", this.onChange);
        this.updatePlayerLatencyPolicyValues();
    }

    onChange = () =>
    {
        this.updatePlayerLatencyPolicyValues();
    }

    removePlayerLatencyPolicy(el)
    {
        el.parent().parent().remove();
        this.updatePlayerLatencyPolicyValues();
    }

    updatePlayerLatencyPolicyValues()
    {
        let periodStart=0;
        $( "#playerLatencyPolicies div.playerLatencyPolicy" ).each(function() {
            $(this).find('.periodStart').val(periodStart);
            let periodEnd = parseInt($(this).find('.periodEnd').val() as string);
            periodStart+=periodEnd;
        });
    }

    getPlayerLatencyPolicyValues()
    {
        let policies=[];
        $( "#playerLatencyPolicies div.playerLatencyPolicy" ).each(function() {
            const periodEnd = parseInt($(this).find('.periodEnd').val() as string);
            const maxLatency = parseInt($(this).find('.maxLatency').val() as string);
            policies.push({
                MaximumIndividualPlayerLatencyMilliseconds: maxLatency,
                PolicyDurationSeconds: periodEnd
            });
        });

        return policies;
    }

    addPlayerLatencyPolicies(policies)
    {
        const html = Game.game.cache.html.get("playerLatencyPolicyTemplate");
        let periodStart=0;
        policies.map(policy =>
        {
            let addedEl = $(html).appendTo("#playerLatencyPolicies");
            addedEl.find('.periodStart').val(periodStart);
            addedEl.find('.periodEnd').val(policy.PolicyDurationSeconds);
            addedEl.find('.maxLatency').val(policy.MaximumIndividualPlayerLatencyMilliseconds);
            periodStart+=policy.PolicyDurationSeconds;
            addedEl.find('.periodEnd').on("input", this.onChange);
        });

    }
}