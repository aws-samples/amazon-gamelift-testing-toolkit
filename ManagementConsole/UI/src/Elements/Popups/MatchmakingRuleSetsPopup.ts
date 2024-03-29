// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import MatchmakingRuleSet = DataTypes.MatchmakingRuleSet;

export class MatchmakingRuleSetsPopup extends Popup
{
    protected _ruleSets: MatchmakingRuleSet[];
    protected _editor;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="ruleSetsPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this.refresh();
    }

    refresh()
    {
        this.hideStatusAlert();
        this.resetTable();
        Network.sendObject({Type:"GetMatchmakingRuleSets"});
    }

    resetTable()
    {
        this.element.find(".ruleSetsContent").html("        <p class=\"title mb-3\"></p>\n" +
            "        <button class=\"newRuleset btn btn-primary btn-sm\">New Rule Set</button>" +
            "        <table id=\"ruleSetsTable\" class=\"table table-bordered table-striped mb-0\">\n" +
            "            <thead>\n" +
            "            <tr>\n" +
            "                <th>Name</th>\n" +
            "                <th>View</th>\n" +
            "                <th>Create Copy</th>\n" +
            "                <th>Delete RuleSet</th>\n" +
            "            </tr>\n" +
            "            </thead>\n" +
            "            <tbody>\n" +
            "            </tbody>\n" +
            "        </table>");
    }

    setupEventListeners()
    {
        super.setupEventListeners();
        this._emitter.on(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
        this._emitter.on(Events.VALIDATE_MATCHMAKING_RULESET_RESPONSE, this.onValidateMatchmakingRuleSetResponse);
        this._emitter.on(Events.CREATE_MATCHMAKING_RULESET_RESPONSE, this.onCreateMatchmakingRuleSetResponse);
        this._emitter.on(Events.DELETE_MATCHMAKING_RULESET_RESPONSE, this.onDeleteMatchmakingRuleSetResponse);
    }

    removeEventListeners()
    {
        super.removeEventListeners();
        this._emitter.off(Events.GET_MATCHMAKING_RULESETS_RESPONSE, this.onGetMatchmakingRuleSetsResponse);
        this._emitter.off(Events.VALIDATE_MATCHMAKING_RULESET_RESPONSE, this.onValidateMatchmakingRuleSetResponse);
        this._emitter.off(Events.CREATE_MATCHMAKING_RULESET_RESPONSE, this.onCreateMatchmakingRuleSetResponse);
        this._emitter.off(Events.DELETE_MATCHMAKING_RULESET_RESPONSE, this.onDeleteMatchmakingRuleSetResponse);
    }

    onGetMatchmakingRuleSetsResponse = (data) =>
    {
        this._ruleSets = data;

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

        this.element.find("table#ruleSetsTable tbody").append(html);
        this.activateDataTable("ruleSetsTable");
    }

    onValidateMatchmakingRuleSetResponse = (data) =>
    {
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
        this.element.find("#statusText").attr("class", "alert alert-success");
        this.element.find("#statusText").html(text);
    }

    showFailureAlert = (text) =>
    {
        this.element.find("#statusText").attr("class", "alert alert-danger");
        this.element.find("#statusText").html(text);
    }

    hideStatusAlert = () =>
    {
        this.element.find("#statusText").attr("class", "alert hide");
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        } else if (event.target.id == "backButton") {
            this.element.find(".ruleSetsContent").attr("class", "ruleSetsContent");
            this.element.find(".ruleSetsDetailContent").attr("class", "ruleSetsDetailContent hide");
            this.resetJson();
            this.refresh();
        } else if (event.target.className.indexOf("viewDetail") !== -1) {
            this.hideStatusAlert();
            let ruleSet = this._ruleSets.filter(ruleSet => ruleSet.RuleSetArn == event.target.id)[0];
            this.showRuleSetDetail(ruleSet);
        } else if (event.target.className.indexOf("newRuleset") !== -1) {
            this.hideStatusAlert();
            this.newRuleSet();
        } else if (event.target.className.indexOf("deleteRuleSet") !== -1) {
            this.hideStatusAlert();
            let ruleSet = this._ruleSets.filter(ruleSet => ruleSet.RuleSetArn == event.target.id)[0];
            this.deleteRuleSet(ruleSet);
        } else if (event.target.className.indexOf("cloneEdit") !== -1) {
            this.hideStatusAlert();
            let ruleSet = this._ruleSets.filter(ruleSet => ruleSet.RuleSetArn == event.target.id)[0];
            this.cloneEditRuleSet(ruleSet);
        } else if (event.target.id == "saveButton") {
            this.hideStatusAlert();
            let ruleSet = JSON.parse(this._editor.getText());
            let editorJson = JSON.stringify(ruleSet);
            let ruleSetName = $('#ruleSetName').val();
            Network.sendObject({Type:"CreateMatchmakingRuleSet", RuleSetBody:editorJson, RuleSetName:ruleSetName});
            //this.resetJson();
        }
        else if (event.target.id == "validateButton") {
            this.hideStatusAlert();
            let editorJson = JSON.stringify(JSON.parse(this._editor.getText()));
            Network.sendObject({Type:"ValidateMatchmakingRuleSet", RuleSetBody:editorJson});
            //this.resetJson();
        }

    }

    cloneEditRuleSet = (ruleSet) =>
    {
        const container = document.getElementById("ruleSetJson")
        const options:JSONEditorOptions = {modes:["code", "tree"], name:"Matchmaking RuleSet"}
        $(".rulesetButtons").show();
        $('#ruleSetName').val("");
        $(".existingRuleSetName").hide();

        this._editor = new JSONEditor(container, options);

        var ruleSetBody = JSON.parse(ruleSet.RuleSetBody);
        this._editor.set(ruleSetBody);

        this.element.find(".ruleSetsContent").attr("class", "ruleSetsContent hide");
        this.element.find("#saveButton").attr("class", "btn btn-primary btn-sm");
        this.element.find("#validateButton").attr("class", "btn btn-primary btn-sm");
        this.element.find(".ruleSetsDetailContent").attr("class", "ruleSetsDetailContent");
    }

    newRuleSet = () =>
    {
        const container = document.getElementById("ruleSetJson")
        const options:JSONEditorOptions = {modes:["code", "tree"], name:"Matchmaking RuleSet"}
        $(".rulesetButtons").show();
        $(".existingRuleSetName").hide();

        this._editor = new JSONEditor(container, options);
        $('#ruleSetName').val("");
        let emptyRuleset = {
            ruleLanguageVersion	: "1.0",
            teams: [ { name:"Team 1", minPlayers:2, maxPlayers:2}]
        }

        this._editor.set(emptyRuleset);

        this.element.find(".ruleSetsContent").attr("class", "ruleSetsContent hide");
        this.element.find("#saveButton").attr("class", "btn btn-primary btn-sm");
        this.element.find("#validateButton").attr("class", "btn btn-primary btn-sm");
        this.element.find(".ruleSetsDetailContent").attr("class", "ruleSetsDetailContent");
    }

    showRuleSetDetail = (ruleSet) =>
    {
        $(".rulesetButtons").hide();
        $(".existingRuleSetName").show();
        $(".existingRuleSetName").html(ruleSet.RuleSetName);
        const container = document.getElementById("ruleSetJson")
        const options:JSONEditorOptions = {mode:"view", name:"Matchmaking RuleSet"}

        this._editor = new JSONEditor(container, options);

        this._editor.set(JSON.parse(ruleSet.RuleSetBody));
        this._editor.expandAll();

        this.element.find(".ruleSetsContent").attr("class", "ruleSetsContent hide");
        this.element.find("#saveButton").attr("class", "btn btn-primary btn-sm hide");
        this.element.find("#validateButton").attr("class", "btn btn-primary btn-sm hide");
        this.element.find(".ruleSetsDetailContent").attr("class", "ruleSetsDetailContent");
    }

    deleteRuleSet = (ruleSet) =>
    {
        Network.sendObject({Type:"DeleteMatchmakingRuleSet", RuleSetName:ruleSet.RuleSetName});
    }

    resetJson()
    {
        this.element.find("#ruleSetJson").html("");
    }

    activateDataTable(id) {
        // @ts-ignore
        $('#'+id).DataTable({
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            order: [[ 0, "desc" ]]
        });
    }
}