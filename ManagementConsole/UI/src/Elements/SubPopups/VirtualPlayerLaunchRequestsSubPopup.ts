// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {VirtualPlayerLaunchRequests} from "../Pages/VirtualPlayerLaunchRequests";
import {VirtualPlayerLaunchRequestTasks} from "../Pages/VirtualPlayerLaunchRequestTasks";
import {VirtualPlayerLaunchRequestTaskLogs} from "../Pages/VirtualPlayerLaunchRequestTaskLogs";

export class VirtualPlayerLaunchRequestsSubPopup extends SubPopup
{
    public constructor (cacheKey:string, parentDomId:string)
    {
        super(cacheKey, parentDomId);
    }

    refresh = ()=>
    {
        PageManager.resetPages();

        let launchRequestsPage = PageManager.registerPage(new VirtualPlayerLaunchRequests());
        let launchRequestTasksPage = PageManager.registerPage(new VirtualPlayerLaunchRequestTasks(launchRequestsPage));
        PageManager.registerPage(new VirtualPlayerLaunchRequestTaskLogs(launchRequestTasksPage));

        PageManager.switchPage(VirtualPlayerLaunchRequests.id);

        this.hideStatusAlert();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}