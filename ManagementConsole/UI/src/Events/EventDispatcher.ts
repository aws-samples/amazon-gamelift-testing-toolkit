// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class EventDispatcher extends Phaser.Events.EventEmitter
{
    protected static instance:EventDispatcher = null;

    constructor() {
        super();
    }

    static getInstance() {
        if (EventDispatcher.instance == null) {
            EventDispatcher.instance = new EventDispatcher();
        }
        return EventDispatcher.instance;
    }
}