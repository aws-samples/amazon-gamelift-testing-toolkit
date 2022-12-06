// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {VirtualPlayerTaskSchedulesTablePage} from "../Pages/VirtualPlayerTaskSchedulesTablePage";
import {VirtualPlayerTaskSchedulesFormPage} from "../Pages/VirtualPlayerTaskSchedulesFormPage";
import {SubPopups} from "./SubPopups";
import {VirtualPlayerTaskScheduleViewPage} from "../Pages/VirtualPlayerTaskScheduleViewPage";

export class VirtualPlayerTasksSchedulesSubPopup extends SubPopup
{
    public static id = SubPopups.VIRTUAL_PLAYER_TASKS_SCHEDULES_SUB_POPUP;
    public static cacheKey = this.id;

    public constructor ()
    {
        super(VirtualPlayerTasksSchedulesSubPopup.cacheKey, VirtualPlayerTasksSchedulesSubPopup.id);
    }


    refresh = ()=>
    {
        PageManager.resetPages();

        let schedulesTablePage = PageManager.registerPage(new VirtualPlayerTaskSchedulesTablePage());
        PageManager.registerPage(new VirtualPlayerTaskSchedulesFormPage(schedulesTablePage));
        PageManager.registerPage(new VirtualPlayerTaskScheduleViewPage(schedulesTablePage));

        PageManager.switchPage(VirtualPlayerTaskSchedulesTablePage.id);

        this.hideStatusAlert();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}