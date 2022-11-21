// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {SimulateMatchmakingOutput} from "../Pages/SimulateMatchmakingOutput";
import {SimulateMatchmakingForm} from "../Pages/SimulateMatchmakingForm";
import {SimulateMatchmakingSimulations} from "../Pages/SimulateMatchmakingSimulations";
import {SimulateMatchmakingTickets} from "../Pages/SimulateMatchmakingTickets";
import {SimulateMatchmakingResults} from "../Pages/SimulateMatchmakingResults";
import {SimulateMatchmakingMatchInfo} from "../Pages/SimulateMatchmakingMatchInfo";
import {SimulateMatchmakingFailedTickets} from "../Pages/SimulateMatchmakingFailedTickets";

export class SimulateMatchmakingSubPopup extends SubPopup
{
    public constructor (cacheKey:string, parentDomId:string)
    {
        super(cacheKey, parentDomId);
    }

    refresh = ()=>
    {
        PageManager.resetPages();

        let simulationsPage = PageManager.registerPage(new SimulateMatchmakingSimulations());
        PageManager.registerPage(new SimulateMatchmakingForm(simulationsPage));

        let outputPage = PageManager.registerPage(new SimulateMatchmakingOutput(simulationsPage));
        PageManager.registerPage(new SimulateMatchmakingTickets(outputPage));

        let resultsPage = PageManager.registerPage(new SimulateMatchmakingResults(outputPage));
        PageManager.registerPage(new SimulateMatchmakingMatchInfo(resultsPage));
        PageManager.registerPage(new SimulateMatchmakingFailedTickets(resultsPage));

        PageManager.switchPage(SimulateMatchmakingSimulations.id);

        this.hideStatusAlert();
    }

    resetTable()
    {
        this.resetElement(".simulateMatchmakingTableContainer");
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        PageManager.getCurrentPage().onPopupClick(event);
    }
}