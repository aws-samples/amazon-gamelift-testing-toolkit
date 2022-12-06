// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {VirtualPlayerLaunchRequestsPage} from "../Pages/VirtualPlayerLaunchRequestsPage";
import {VirtualPlayerLaunchRequestTasksPage} from "../Pages/VirtualPlayerLaunchRequestTasksPage";
import {VirtualPlayerLaunchRequestTaskLogsPage} from "../Pages/VirtualPlayerLaunchRequestTaskLogsPage";
import {SubPopups} from "./SubPopups";

export class VirtualPlayerLaunchRequestsSubPopup extends SubPopup
{
    public static id = SubPopups.VIRTUAL_PLAYER_TASKS_LAUNCH_REQUESTS_SUB_POPUP;
    public static cacheKey = this.id;

    public constructor ()
    {
        super(VirtualPlayerLaunchRequestsSubPopup.cacheKey, VirtualPlayerLaunchRequestsSubPopup.id);
    }

    refresh = ()=>
    {
        PageManager.resetPages();

        let launchRequestsPage = PageManager.registerPage(new VirtualPlayerLaunchRequestsPage());
        let launchRequestTasksPage = PageManager.registerPage(new VirtualPlayerLaunchRequestTasksPage(launchRequestsPage));
        PageManager.registerPage(new VirtualPlayerLaunchRequestTaskLogsPage(launchRequestTasksPage));

        PageManager.switchPage(VirtualPlayerLaunchRequestsPage.id);

        this.hideStatusAlert();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}