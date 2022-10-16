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
        this._popup.node.querySelector(".ruleSetsContent").innerHTML="        <p class=\"title mb-3\"></p>\n" +
            "        <btn class=\"newRuleset btn btn-primary btn-sm\">New Ruleset</btn>" +
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
            "        </table>";
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

        this._popup.node.querySelector("table#ruleSetsTable tbody").insertAdjacentHTML("beforeend", html);
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
            this.showFailureAlert("Ruleset JSON could not be validated!");
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
        this._popup.node.querySelector("#statusText").className = "alert alert-success";
        this._popup.node.querySelector("#statusText").innerHTML = text;
    }

    showFailureAlert = (text) =>
    {
        this._popup.node.querySelector("#statusText").className = "alert alert-danger";
        this._popup.node.querySelector("#statusText").innerHTML = text;
    }

    hideStatusAlert = () =>
    {
        this._popup.node.querySelector("#statusText").className = "alert hide";
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "closeButton") {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        } else if (event.target.id == "backButton") {
            this._popup.node.querySelector(".ruleSetsContent").className = "ruleSetsContent";
            this._popup.node.querySelector(".ruleSetsDetailContent").className = "ruleSetsDetailContent hide";
            this.resetJson();
            this.refresh();
        } else if (event.target.className.indexOf("viewDetail") !== -1) {
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
        console.log(ruleSet);

        const container = document.getElementById("ruleSetJson")
        const options:JSONEditorOptions = {modes:["code", "tree"], name:"Matchmaking RuleSet"}
        $(".rulesetButtons").show();
        $('#ruleSetName').val("");
        $(".existingRuleSetName").hide();

        this._editor = new JSONEditor(container, options);

        var ruleSetBody = JSON.parse(ruleSet.RuleSetBody);
        this._editor.set(ruleSetBody);

        this._popup.node.querySelector(".ruleSetsContent").className="ruleSetsContent hide";
        this._popup.node.querySelector("#saveButton").className="btn btn-primary btn-sm";
        this._popup.node.querySelector("#validateButton").className="btn btn-primary btn-sm";
        this._popup.node.querySelector(".ruleSetsDetailContent").className="ruleSetsDetailContent";
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
            teams: [ { name:"Team", minPlayers:1, maxPlayers:2}]
        }

        this._editor.set(emptyRuleset);

        this._popup.node.querySelector(".ruleSetsContent").className="ruleSetsContent hide";
        this._popup.node.querySelector("#saveButton").className="btn btn-primary btn-sm";
        this._popup.node.querySelector("#validateButton").className="btn btn-primary btn-sm";
        this._popup.node.querySelector(".ruleSetsDetailContent").className="ruleSetsDetailContent";
    }

    showRuleSetDetail = (ruleSet) =>
    {
        console.log(ruleSet);
        $(".rulesetButtons").hide();
        $(".existingRuleSetName").show();
        $(".existingRuleSetName").html(ruleSet.RuleSetName);
        const container = document.getElementById("ruleSetJson")
        const options:JSONEditorOptions = {mode:"view", name:"Matchmaking RuleSet"}

        this._editor = new JSONEditor(container, options);

        this._editor.set(JSON.parse(ruleSet.RuleSetBody));

        this._popup.node.querySelector(".ruleSetsContent").className="ruleSetsContent hide";
        this._popup.node.querySelector("#saveButton").className="btn btn-primary btn-sm hide";
        this._popup.node.querySelector("#validateButton").className="btn btn-primary btn-sm hide";
        this._popup.node.querySelector(".ruleSetsDetailContent").className="ruleSetsDetailContent";
    }

    deleteRuleSet = (ruleSet) =>
    {
        Network.sendObject({Type:"DeleteMatchmakingRuleSet", RuleSetName:ruleSet.RuleSetName});
        console.log("DELETE!");
        console.log(ruleSet);
    }

    resetJson()
    {
        this._popup.node.querySelector("#ruleSetJson").innerHTML="";
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