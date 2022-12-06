// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {VirtualPlayerTasksLaunchPage} from "../Pages/VirtualPlayerTasksLaunchPage";
import {SubPopups} from "./SubPopups";

export class VirtualPlayerTasksLaunchSubPopup extends SubPopup
{
    public static id = SubPopups.VIRTUAL_PLAYER_TASKS_LAUNCH_SUB_POPUP;
    public static cacheKey = this.id;

    public constructor ()
    {
        super(VirtualPlayerTasksLaunchSubPopup.cacheKey, VirtualPlayerTasksLaunchSubPopup.id);
    }

    refresh = ()=>
    {
        PageManager.resetPages();
        PageManager.registerPage(new VirtualPlayerTasksLaunchPage());

        PageManager.switchPage(VirtualPlayerTasksLaunchPage.id);
        this.hideStatusAlert();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}