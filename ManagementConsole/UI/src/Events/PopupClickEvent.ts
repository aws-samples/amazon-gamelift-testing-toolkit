// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class PopupClickEvent
{
    public gameObject:any;
    public localX:any;
    public localY:any;

    constructor (gameObject:any, localX:any=null, localY:any=null)
    {
        this.gameObject = gameObject;
        this.localX = localX;
        this.localY = localY;
    }
}