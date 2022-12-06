// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {SubPopup} from "../Abstract/SubPopup";
import {PageManager} from "../Pages/PageManager";
import {SimulateMatchmakingOutputPage} from "../Pages/SimulateMatchmakingOutputPage";
import {SimulateMatchmakingFormPage} from "../Pages/SimulateMatchmakingFormPage";
import {SimulateMatchmakingSimulationsPage} from "../Pages/SimulateMatchmakingSimulationsPage";
import {SimulateMatchmakingTicketsPage} from "../Pages/SimulateMatchmakingTicketsPage";
import {SimulateMatchmakingResultsPage} from "../Pages/SimulateMatchmakingResultsPage";
import {SimulateMatchmakingMatchInfoPage} from "../Pages/SimulateMatchmakingMatchInfoPage";
import {SimulateMatchmakingFailedTicketsPage} from "../Pages/SimulateMatchmakingFailedTicketsPage";
import {SubPopups} from "./SubPopups";

export class SimulateMatchmakingSubPopup extends SubPopup
{
    public static id = SubPopups.SIMULATE_MATCHMAKING_SUB_POPUP;
    public static cacheKey = this.id;

    public constructor ()
    {
        super(SimulateMatchmakingSubPopup.cacheKey, SimulateMatchmakingSubPopup.id);
    }

    refresh = ()=>
    {
        PageManager.resetPages();

        let simulationsPage = PageManager.registerPage(new SimulateMatchmakingSimulationsPage());
        PageManager.registerPage(new SimulateMatchmakingFormPage(simulationsPage));

        let outputPage = PageManager.registerPage(new SimulateMatchmakingOutputPage(simulationsPage));
        PageManager.registerPage(new SimulateMatchmakingTicketsPage(outputPage));

        let resultsPage = PageManager.registerPage(new SimulateMatchmakingResultsPage(outputPage));
        PageManager.registerPage(new SimulateMatchmakingMatchInfoPage(resultsPage));
        PageManager.registerPage(new SimulateMatchmakingFailedTicketsPage(resultsPage));

        PageManager.switchPage(SimulateMatchmakingSimulationsPage.id);

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