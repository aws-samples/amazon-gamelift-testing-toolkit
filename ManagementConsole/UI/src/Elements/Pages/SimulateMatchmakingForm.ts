// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {PageManager} from "./PageManager";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {DataTypes} from "../../Data/DataTypes";
import PlayerProfile = DataTypes.PlayerProfile;
import LatencyProfile = DataTypes.LatencyProfile;
import MatchmakingRuleSet = DataTypes.MatchmakingRuleSet;
import {Game} from "../../Game";

export class SimulateMatchmakingForm extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_FORM;
    public static cacheKey = "simulateMatchmakingForm";
    protected _playerProfiles: PlayerProfile[];
    protected _latencyProfiles: LatencyProfile[];
    protected _ruleSets: MatchmakingRuleSet[];

    public constructor (parentPage:Page=null)
    {
        super(SimulateMatchmakingForm.cacheKey, parentPage, SimulateMatchmakingForm.id);
        this._playerProfiles=[];
        this._latencyProfiles=[];
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.attr("id")=="backToMatchmakingSimulations") // show simulations list
        {
            this.goBack();
        }
        else if (el.attr("id")=="addPlayerProfile")
        {
            this.addPlayerProfile();
        }
        else if (el.hasClass("removeProfile"))
        {
            el.parent().parent().parent().remove();
        }
        else if (el.attr("id")=="runSimulation")// actually run simulation
        {
            this.runSimulation();
        }
    }

    runSimulation = () =>
    {
        let playerProfileConfigs=[];
        let totalPlayersAdded=0;

        $('#'+this._domId).find(".playerProfileTemplate").each(function ()
        {
            let numPlayers = parseInt($(this).find('.numPlayers').val() as string);
            if (numPlayers >0)
            {
                playerProfileConfigs.push({
                    ProfileId: $(this).find('#playerProfile').val(),
                    NumPlayers: numPlayers,
                    LatencyProfileId: $(this).find('#latencyProfile').val(),
                    TimeDelay: parseInt($(this).find('#timeDelay').val() as string),
                });

                totalPlayersAdded += parseInt($(this).find('.numPlayers').val() as string);
            }

        });

        if (totalPlayersAdded==0 || totalPlayersAdded>1000)
        {
            this.showFailureAlert("You need to simulate between 1-1000 players");
        }
        else
        {
            Network.sendObject({Type:"RunMatchmakingSimulation", RuleSet: $('#simulationRuleSet').val(), PlayerProfileConfigs: playerProfileConfigs});
        }
    }

    initPage()
    {
        Network.sendObject({Type:"GetPlayerProfiles"});
        Network.sendObject({Type:"GetLatencyProfiles"});
        Network.sendObject({Type:"GetMatchmakingRuleSets"});
    }

    setupEventListeners() {
        this._emitter.on(Events.RUN_MATCHMAKING_SIMULATION_RESPONSE, this.onRunMatchmakingSimulationResponse);
        this._emitter.on(Events.GET_PLAYER_PROFILES_RESPONSE, this.onGetPlayerProfilesResponse);
        this._emitter.on(Events.GET_LATENCY_PROFILES_RESPONSE, this.onGetLatencyProfilesResponse);
        this._emitter.on(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.RUN_MATCHMAKING_SIMULATION_RESPONSE, this.onRunMatchmakingSimulationResponse);
        this._emitter.off(Events.GET_PLAYER_PROFILES_RESPONSE, this.onGetPlayerProfilesResponse);
        this._emitter.off(Events.GET_LATENCY_PROFILES_RESPONSE, this.onGetLatencyProfilesResponse);
        this._emitter.off(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
    }

    onRunMatchmakingSimulationResponse = (simulation) =>
    {
        PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_OUTPUT, simulation);
    }

    addPlayerProfile = () =>
    {
        this.hideStatusAlert();
        const html = Game.game.cache.html.get("playerProfileTemplate");
        let template = $(html);
        if (this._playerProfiles.length)
        {
            this._playerProfiles.map(profile => {
                template.find("select#playerProfile").append('<option value="' + profile.ProfileId + '">' + profile.Name + '</option>');
            });
        }
        if (this._latencyProfiles.length)
        {
            this._latencyProfiles.map(profile => {
                template.find("select#latencyProfile").append('<option value="' + profile.ProfileId + '">' + profile.Name + '</option>');
            });
        }
        template.appendTo($('#'+this._domId).find("#simulationPlayerProfiles"));
    }

    onGetPlayerProfilesResponse = (data) =>
    {
        this._playerProfiles = data;
    }

    onGetLatencyProfilesResponse = (data) =>
    {
        this._latencyProfiles = data;
    }

    onGetMatchmakingRuleSetsResponse = (data) => {
        this._ruleSets = data;
        $('#'+this._domId).find("#simulationRuleSet").html("");
        this._ruleSets.map(ruleset=>
        {
            $('#'+this._domId).find("#simulationRuleSet").append('<option value="' + ruleset.RuleSetArn + '">' + ruleset.RuleSetName + '</option>');
        })
    }
}