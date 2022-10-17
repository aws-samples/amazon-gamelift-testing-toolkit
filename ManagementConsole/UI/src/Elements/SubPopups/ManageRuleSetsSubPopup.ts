// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Fleet} from "../Fleet";
import DOMElement = Phaser.GameObjects.DOMElement;
import {Network} from "../../Network/Network";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Rectangle = Phaser.GameObjects.Rectangle;
import config from "../../Config/Config"
import {Popup} from "../Abstract/Popup";
import Instance = DataTypes.Instance;
import GameSession = DataTypes.GameSession;
import GameSessionQueue = DataTypes.GameSessionQueue;
import QueuePlacementEventDetail = DataTypes.QueuePlacementEventDetail;
import {Utils} from "../../Utils/Utils";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import MatchmakingRuleSet = DataTypes.MatchmakingRuleSet;
import PlayerProfileAttribute = DataTypes.PlayerProfileAttribute;
import {SimulateMatchmakingSubPopup} from "./SimulateMatchmakingSubPopup";
import {SubPopup} from "../Abstract/SubPopup";

export class ManageRuleSetsSubPopup extends SubPopup
{
    protected _ruleSets: MatchmakingRuleSet[];
    protected _editor;

    public constructor (url:string, parentDomId:string)
    {
        super(url, parentDomId);
    }

    hideStatusAlert()
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert hide";
    }

    refresh = () =>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetMatchmakingRuleSets"});
    }

    resetElement(selector)
    {
        console.log("RESETTING "+selector);
        let el = $(this._html);
        $('#'+this._parentDomId).find(selector).html(el.find(selector).html());
    }

    resetTable()
    {
        this.resetElement(".ruleSetsContent");
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
        this._emitter.on(Events.VALIDATE_MATCHMAKING_RULESET_RESPONSE, this.onValidateMatchmakingRuleSetResponse);
        this._emitter.on(Events.CREATE_MATCHMAKING_RULESET_RESPONSE, this.onCreateMatchmakingRuleSetResponse);
        this._emitter.on(Events.DELETE_MATCHMAKING_RULESET_RESPONSE, this.onDeleteMatchmakingRuleSetResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
        this._emitter.off(Events.VALIDATE_MATCHMAKING_RULESET_RESPONSE, this.onValidateMatchmakingRuleSetResponse);
        this._emitter.off(Events.CREATE_MATCHMAKING_RULESET_RESPONSE, this.onCreateMatchmakingRuleSetResponse);
        this._emitter.off(Events.DELETE_MATCHMAKING_RULESET_RESPONSE, this.onDeleteMatchmakingRuleSetResponse);
    }

    onGetMatchmakingRuleSetsResponse = (data) =>
    {
        console.log("GOT RULESETS RESPONSE!");
        this._ruleSets = data;

        console.log(this._ruleSets);
        let html="";
        data.map(ruleSet =>
        {
            let ruleSetDetailLinkTd='<td><a class="viewDetail btn btn-primary btn-sm" id="' + ruleSet.RuleSetArn +'" href="' + "#" + '">View Detail</a></td>';
            let cloneLinkTd='<td><a class="cloneEdit btn btn-primary btn-sm" id="' + ruleSet.RuleSetArn +'" href="' + "#" + '">Create Copy</a></td>';
            let deleteLinkTd='<td><a class="deleteRuleSet btn btn-primary btn-sm" id="' + ruleSet.RuleSetArn +'" href="' + "#" + '">Delete RuleSet</a></td>';

            html += '<tr>' +
                '<td>' + ruleSet.RuleSetName + '</td>'+
                ruleSetDetailLinkTd +
                cloneLinkTd +
                deleteLinkTd +
                '</tr>';
        });

        this.resetTable();
        $('#'+this._parentDomId).find("table#ruleSetsTable tbody").append( html);
        this.activateDataTable("ruleSetsTable");
    }

    onValidateMatchmakingRuleSetResponse = (data) =>
    {
        console.log("GOT VALIDATE RESPONSE!");
        console.log(data);
        if (data.Validated)
        {
            this.showSuccessAlert("Ruleset JSON validated successfully");
        }
        else
        {
            this.showFailureAlert(data.ErrorMessage);
        }
    }

    onCreateMatchmakingRuleSetResponse = (data) =>
    {
        console.log("GOT CREATE RESPONSE!");
        console.log(data);
        if (data.Created)
        {
            this.showSuccessAlert("Ruleset created successfully");
            this.resetJson();
            this.showRuleSetDetail(data.RuleSet);
        }
        else
        {
            this.showFailureAlert("Error: " + data.ErrorMessage);
        }
    }

    onDeleteMatchmakingRuleSetResponse = (data) =>
    {
        console.log("GOT DELETE RESPONSE!");
        console.log(data);
        if (data.Deleted==false)
        {
            this.showFailureAlert("Error: " + data.ErrorMessage)
        }
        else
        {
            this.refresh();
        }
    }

    showSuccessAlert = (text) =>
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert alert-success";
        $('#'+this._parentDomId).find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert alert-danger";
        $('#'+this._parentDomId).find("#statusText").html(text);
    }

    onPopupClick = async (event) => {
        event.stopPropagation();

        if (event.target.id == "backButton") {
            $('#'+this._parentDomId).find(".ruleSetsContent")[0].className = "ruleSetsContent";
            $('#'+this._parentDomId).find(".ruleSetsDetailContent")[0].className = "ruleSetsDetailContent hide";
            this.resetJson();
            this.refresh();
        }
        else if (event.target.className.indexOf("viewDetail") !== -1) {
            this.hideStatusAlert();
            console.log(event.target.id);
            let ruleSet = this._ruleSets.filter(ruleSet => ruleSet.RuleSetArn == event.target.id)[0];
            this.showRuleSetDetail(ruleSet);
        } else if (event.target.className.indexOf("newRuleset") !== -1) {
            this.hideStatusAlert();
            this.newRuleSet();
        } else if (event.target.className.indexOf("deleteRuleSet") !== -1) {
            this.hideStatusAlert();
            console.log(event.target.id);
            let ruleSet = this._ruleSets.filter(ruleSet => ruleSet.RuleSetArn == event.target.id)[0];
            this.deleteRuleSet(ruleSet);
        } else if (event.target.className.indexOf("cloneEdit") !== -1) {
            this.hideStatusAlert();
            console.log(event.target.id);
            let ruleSet = this._ruleSets.filter(ruleSet => ruleSet.RuleSetArn == event.target.id)[0];
            this.cloneEditRuleSet(ruleSet);
        } else if (event.target.id == "saveButton") {
            this.hideStatusAlert();
            console.log("SAVE!!");
            console.log(this._editor.getText());
            let ruleSet = JSON.parse(this._editor.getText());
            let editorJson = JSON.stringify(ruleSet);
            let ruleSetName = $('#ruleSetName').val();
            Network.sendObject({Type:"CreateMatchmakingRuleSet", RuleSetBody:editorJson, RuleSetName:ruleSetName});
            //this.resetJson();
        }
        else if (event.target.id == "validateButton") {
            this.hideStatusAlert();
            console.log("VALIDATE!!");
            console.log(this._editor.getText());
            let editorJson = JSON.stringify(JSON.parse(this._editor.getText()));
            Network.sendObject({Type:"ValidateMatchmakingRuleSet", RuleSetBody:editorJson});
            //this.resetJson();
        }

    }

    cloneEditRuleSet = (ruleSet) =>
    {
        const container = $('#'+this._parentDomId).find("#ruleSetJson")[0];
        const options:JSONEditorOptions = {modes:["code", "tree"], name:"Matchmaking RuleSet"}

        this._editor = new JSONEditor(container, options);
        $(".existingRuleSetName").hide();
        $(".rulesetButtons").show();
        $('#ruleSetName').val("");
        var ruleSetBody = JSON.parse(ruleSet.RuleSetBody);
        this._editor.set(ruleSetBody);

        $('#'+this._parentDomId).find(".ruleSetsContent")[0].className="ruleSetsContent hide";
        $('#'+this._parentDomId).find("#saveButton")[0].className="btn btn-primary btn-sm";
        $('#'+this._parentDomId).find("#validateButton")[0].className="btn btn-primary btn-sm";
        $('#'+this._parentDomId).find(".ruleSetsDetailContent")[0].className="ruleSetsDetailContent";
    }

    newRuleSet = () =>
    {
        const container = document.getElementById("ruleSetJson")
        const options:JSONEditorOptions = {modes:["code", "tree"], name:"Matchmaking RuleSet"}
        $(".existingRuleSetName").hide();
        $(".rulesetButtons").show();
        $('#ruleSetName').val("");
        this._editor = new JSONEditor(container, options);
        $('#ruleSetName').val("");
        let emptyRuleset = {
            ruleLanguageVersion	: "1.0",
            teams: [ { name:"Team 1", minPlayers:2, maxPlayers:2}]
        }

        this._editor.set(emptyRuleset);

        $('#'+this._parentDomId).find(".ruleSetsContent")[0].className="ruleSetsContent hide";
        $('#'+this._parentDomId).find("#saveButton")[0].className="btn btn-primary btn-sm";
        $('#'+this._parentDomId).find("#validateButton")[0].className="btn btn-primary btn-sm";
        $('#'+this._parentDomId).find(".ruleSetsDetailContent")[0].className="ruleSetsDetailContent";
    }

    showRuleSetDetail = (ruleSet) =>
    {
        const container = $('#'+this._parentDomId).find("#ruleSetJson")[0];
        const options:JSONEditorOptions = {mode:"view", name:"Matchmaking RuleSet"}

        this._editor = new JSONEditor(container, options);
        $(".existingRuleSetName").show();
        $(".existingRuleSetName").html(ruleSet.RuleSetName);
        $(".rulesetButtons").hide();

        console.log(container);
        console.log(this._editor);

        this._editor.set(JSON.parse(ruleSet.RuleSetBody));

        $('#'+this._parentDomId).find(".ruleSetsContent")[0].className="ruleSetsContent hide";
        $('#'+this._parentDomId).find("#saveButton")[0].className="btn btn-primary btn-sm hide";
        $('#'+this._parentDomId).find("#validateButton")[0].className="btn btn-primary btn-sm hide";
        $('#'+this._parentDomId).find(".ruleSetsDetailContent")[0].className="ruleSetsDetailContent";
    }

    deleteRuleSet = (ruleSet) =>
    {
        Network.sendObject({Type:"DeleteMatchmakingRuleSet", RuleSetName:ruleSet.RuleSetName});
    }

    resetJson()
    {
        $('#'+this._parentDomId).find("#ruleSetJson").html("");
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