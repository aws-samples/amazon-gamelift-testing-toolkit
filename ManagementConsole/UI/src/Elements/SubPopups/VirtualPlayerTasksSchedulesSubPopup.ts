// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {SubPopup} from "../Abstract/SubPopup";

export class VirtualPlayerTasksSchedulesSubPopup extends SubPopup
{
    public constructor (cacheKey:string, parentDomId:string)
    {
        super(cacheKey, parentDomId);
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        //Network.sendObject({Type:"GetLatencyProfiles"});
    }

    setupEventListeners()
    {
    }

    removeEventListeners()
    {
    }
}