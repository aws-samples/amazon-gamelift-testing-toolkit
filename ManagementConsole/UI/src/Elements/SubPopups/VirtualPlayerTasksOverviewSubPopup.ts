// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {VirtualPlayerTasksOverviewPage} from "../Pages/VirtualPlayerTasksOverviewPage";
import {SubPopups} from "./SubPopups";

export class VirtualPlayerTasksOverviewSubPopup extends SubPopup
{
    public static id = SubPopups.VIRTUAL_PLAYER_TASKS_OVERVIEW_SUB_POPUP;
    public static cacheKey = this.id;

    public constructor ()
    {
        super(VirtualPlayerTasksOverviewSubPopup.cacheKey, VirtualPlayerTasksOverviewSubPopup.id);
    }

    refresh = ()=>
    {
        PageManager.resetPages();

        let overviewPage = PageManager.registerPage(new VirtualPlayerTasksOverviewPage());

        PageManager.switchPage(VirtualPlayerTasksOverviewPage.id);

        this.hideStatusAlert();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}