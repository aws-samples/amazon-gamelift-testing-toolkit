// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {VirtualPlayerTaskSchedulesTable} from "../Pages/VirtualPlayerTaskSchedulesTable";
import {VirtualPlayerTaskSchedulesForm} from "../Pages/VirtualPlayerTaskSchedulesForm";

export class VirtualPlayerTasksSchedulesSubPopup extends SubPopup
{
    public constructor (cacheKey:string, parentDomId:string)
    {
        super(cacheKey, parentDomId);
    }

    refresh = ()=>
    {
        PageManager.resetPages();

        let schedulesTablePage = PageManager.registerPage(new VirtualPlayerTaskSchedulesTable());
        let schedulesFormPage = PageManager.registerPage(new VirtualPlayerTaskSchedulesForm(schedulesTablePage));

        PageManager.switchPage(VirtualPlayerTaskSchedulesTable.id);

        this.hideStatusAlert();
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}