// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {EventDispatcher} from '../Events/EventDispatcher';
import {Events} from '../Events/Events';
import {DataTypes} from "../Data/DataTypes";
import MultipartMessage = DataTypes.MultipartMessage;

export class MultipartMessageHandler
{
    protected messages:Record<string, MultipartMessage[]>;
    protected emitter:EventDispatcher;

    constructor() {
        this.emitter = EventDispatcher.getInstance();
        this.messages = {};
    }

    public addMessage(msg:MultipartMessage)
    {
        if (this.messages[msg.MessageId]==null)
        {
            this.messages[msg.MessageId] = [];
        }

        this.messages[msg.MessageId].push(msg);

        if (msg.TotalParts==this.messages[msg.MessageId].length)
        {
            this.messages[msg.MessageId].sort((a, b) => a.PartNumber < b.PartNumber ? -1 : a.PartNumber > b.PartNumber ? 1 : 0);
            let fullJson="";
            this.messages[msg.MessageId].map((message)=>
            {
                fullJson += message.Payload;
            })

            let obj = JSON.parse(fullJson);
            this.emitter.emit(Events.SOCKET_MESSAGE, obj);
        }
    }
}
