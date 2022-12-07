// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {SubPopup} from "../Abstract/SubPopup";
import {SubPopups} from "./SubPopups";

export class RuleSetBuilderSubPopup extends SubPopup
{
    public static id = SubPopups.RULE_SET_BUILDER_SUB_POPUP;
    public static cacheKey = this.id;

    public constructor ()
    {
        super(RuleSetBuilderSubPopup.cacheKey, RuleSetBuilderSubPopup.id);
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetMatchmakingSimulations"});
    }

    resetTable()
    {

    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, this.onGetMatchmakingSimulationsResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_MATCHMAKING_SIMULATIONS_RESPONSE, this.onGetMatchmakingSimulationsResponse);
    }

    onGetMatchmakingSimulationsResponse = (data) =>
    {
        let html="";
        data.map(simulation =>
        {
            let viewResultsTd='<td><a class="editPlayerProfile btn btn-primary btn-sm" id="' + simulation.SimulationId +'" href="' + "#" + '">View Results</a></td>';

            html += '<tr>' +
                '<td>' + simulation.Date + '</td>'+
                '<td>' + simulation.RuleSet + '</td>'+
                '<td>' + simulation.PlayersConfig.length + '</td>'+
                '<td>' + simulation.PlayersConfig.length + '</td>'+
                viewResultsTd +
                '</tr>';
        });

        $('#'+this._parentDomId).find("table#matchmakingSimulationsTable tbody").append( html);
        this.activateDataTable("matchmakingSimulationsTable");
    }

    showSuccessAlert = (text) =>
    {
        $('#'+this._parentDomId).find("#statusText").attr("class","alert alert-success");
        $('#'+this._parentDomId).find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        $('#'+this._parentDomId).find("#statusText").attr("class","alert alert-danger");
        $('#'+this._parentDomId).find("#statusText").html(text);
    }

    hideStatusAlert = () =>
    {
        $('#'+this._parentDomId).find("#statusText").attr("class","alert hide");
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (event.target.id == "backButton") {
            $('#'+this._parentDomId).find(".ruleSetsContent")[0].className = "ruleSetsContent";
            $('#'+this._parentDomId).find(".ruleSetsDetailContent")[0].className = "ruleSetsDetailContent hide";
            this.refresh();
        }
        else if (event.target.id=="simulateMatchmakingButton")
        {
            $('.simulateMatchmakingForm').show();
            $('.simulateMatchmakingTableContainer').hide();
        }
        else if (el.hasClass("backToMatchmakingSimulations"))
        {
            $('.simulateMatchmakingForm').hide();
            $('.simulateMatchmakingTableContainer').show();
        }
    }

    activateDataTable(id) {
        // @ts-ignore
        $('#'+this._parentDomId).find("#"+id).DataTable({
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            order: [[ 0, "desc" ]]
        });
    }
}