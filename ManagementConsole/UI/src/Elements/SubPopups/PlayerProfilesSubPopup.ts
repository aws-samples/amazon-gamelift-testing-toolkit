// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import PlayerProfileAttribute = DataTypes.PlayerProfileAttribute;
import {SubPopup} from "../Abstract/SubPopup";
import PlayerProfile = DataTypes.PlayerProfile;

export class PlayerProfilesSubPopup extends SubPopup
{
    protected _playerProfiles: Record<string, PlayerProfile>;
    protected _editor;

    public constructor (url:string, parentDomId:string)
    {
        super(url, parentDomId);
        this._playerProfiles={};
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetPlayerProfiles"});
    }

    resetElement(selector)
    {
        let el = $(this._html);
        $('#'+this._parentDomId).find(selector).html(el.find(selector).html());
    }

    resetTable()
    {
        this.resetElement(".playerProfilesTableContainer");
    }

    resetPlayerProfileForm()
    {
        this.resetElement(".playerProfileForm");
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_PLAYER_PROFILES_RESPONSE, this.onGetPlayerProfilesResponse);
        this._emitter.on(Events.SAVE_PLAYER_PROFILE_RESPONSE, this.onSavePlayerProfileResponse);
        this._emitter.on(Events.DELETE_PLAYER_PROFILE_RESPONSE, this.onDeletePlayerProfileResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_PLAYER_PROFILES_RESPONSE, this.onGetPlayerProfilesResponse);
        this._emitter.off(Events.SAVE_PLAYER_PROFILE_RESPONSE, this.onSavePlayerProfileResponse);
        this._emitter.off(Events.DELETE_PLAYER_PROFILE_RESPONSE, this.onDeletePlayerProfileResponse);
    }

    onSavePlayerProfileResponse = (data) =>
    {
        console.log(data);
        if (data.Errors.length==0)
        {
            this.refresh();
            this.showPlayerProfileList();
        }
        else
        {
            this.showFailureAlert(data.Errors[0]);
        }
    }

    onDeletePlayerProfileResponse = (data) =>
    {
        console.log(data);
        if (data.Errors.length==0)
        {
            this.refresh();
            this.showPlayerProfileList();
        }
        else
        {
            this.showFailureAlert(data.Errors[0]);
        }
    }

    onGetPlayerProfilesResponse = (data) =>
    {
        console.log("GOT PLAYER PROFILES RESPONSE!");
        let html="";
        this._playerProfiles={};
        data.map(profile =>
        {
            this._playerProfiles[profile.ProfileId] = profile;

            console.log(profile);

            let editProfileTd='<td><a class="editPlayerProfile btn btn-primary btn-sm" id="' + profile.ProfileId +'" href="' + "#" + '">Edit Profile</a></td>';
            let deleteProfileTd='<td><a class="deletePlayerProfile btn btn-primary btn-sm" id="' + profile.ProfileId +'" href="' + "#" + '">Delete Profile</a></td>';

            html += '<tr>' +
                '<td>' + profile.Name + '</td>'+
                '<td>' + profile.Attributes.length + '</td>'+
                editProfileTd +
                deleteProfileTd +
                '</tr>';
        });
        this.resetTable();
        $("table#playerProfilesTable tbody").append( html);
        this.activateDataTable("playerProfilesTable");
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

    hideStatusAlert = () =>
    {
        $('#'+this._parentDomId).find("#statusText")[0].className = "alert hide";
    }

    onAttributeTypeChange = async (event) =>
    {
        console.log("ATTRIBUTE TYPE CHANGE!");

        let el = $(event.target);
        console.log("SHOWING", 'div.playerAttributeForm-'+el.val());
        el.parent().parent().find("div.playerAttributeForm-S").hide();
        el.parent().parent().find("div.playerAttributeForm-N").hide();
        el.parent().parent().find("div.playerAttributeForm-SL").hide();
        el.parent().parent().find("div.playerAttributeForm-SDM").hide();
        el.parent().parent().find('div.playerAttributeForm-'+el.val()).show();
    }

    onValueTypeChange = async (event) =>
    {
        console.log("VALUE TYPE CHANGE");
        let el = $(event.target);
        let parent = $(event.target).parent().parent().parent();
        //console.log(el);
        let attributeType = parent.find(".attributeType").val();
        //console.log(attributeType);
        switch(attributeType)
        {
            case "N":
            case "SL":
                parent.find("div.playerAttributeForm-"+attributeType+" div.valueTypes div.playerValue").hide(); // need to only hide the top divs
                console.log(parent.html());
                console.log("SHOWING " + "div.playerAttributeForm-"+attributeType+"-"+el.val());
                parent.find("div.playerAttributeForm-"+attributeType+"-"+el.val()).show();
                console.log(parent.html());
                break;
        }
        //console.log(parent.html());
        el.parent().parent().find("div.playerAttributeForm-S").hide();
        el.parent().parent().find("div.playerAttributeForm-N").hide();
        el.parent().parent().find("div.playerAttributeForm-SL").hide();
        el.parent().parent().find("div.playerAttributeForm-SDM").hide();
        el.parent().parent().find('div.playerAttributeForm-'+el.val()).show();
    }

    validatePlayerProfileForm = () =>
    {
        let playerProfile: DataTypes.PlayerProfile = {
            Name: $('#playerProfileName').val() as string,
            Attributes: null
        };

        if (playerProfile.Name=="")
        {
            this.showFailureAlert("You must specify a name for your profile!")
            return null;
        }

        let playerAttributes:PlayerProfileAttribute[] = [];
        $( "#playerProfileAttributes div.playerAttribute" ).each(function() {
            let attributeName = $(this).find("input.playerAttributeForm-name").val() as string;

            if (attributeName.length==0)
            {
                $(this).find("input.playerAttributeForm-name").addClass("errorBorder");
                return null;
            }
            else
            {
                $(this).find("input.playerAttributeForm-name").removeClass("errorBorder");
            }
            let attributeType = $(this).find("select.attributeType").val();
            console.log(attributeType);
            let valueType = $(this).find(".playerAttributeForm-"+attributeType).find("select.valueType").val();
            console.log(valueType);

            let myObj: PlayerProfileAttribute = {
                AttributeName:attributeName as string,
                AttributeType:attributeType as string,
                Value:"",
                ValueType:valueType as string,
                ValueMap:{},
            };

            if (valueType=="randomInteger")
            {
                myObj.Min = parseInt($(this).find(".playerAttributeForm-"+attributeType+"-value-min").val() as string);
                myObj.Max = parseInt($(this).find(".playerAttributeForm-"+attributeType+"-value-max").val() as string);
            }
            else
            if (valueType=="randomDouble")
            {
                myObj.Min = parseFloat($(this).find(".playerAttributeForm-"+attributeType+"-value-min").val() as string);
                myObj.Max = parseFloat($(this).find(".playerAttributeForm-"+attributeType+"-value-max").val() as string);
            }
            else if (valueType=="value")
            {
                if (attributeType=="N")
                {
                    myObj.Value = parseInt($(this).find(".playerAttributeForm-"+attributeType+"-value-value").val() as string);
                }

                if (attributeType=="S")
                {
                    myObj.Value = $(this).find(".playerAttributeForm-"+attributeType+"-value-value").val();
                }
                if (attributeType=="SL")
                {
                    let stringListValues = [];
                    let stringListText = $(this).find(".playerAttributeForm-"+attributeType+"-value-value").val() as string;
                    console.log("STRING LIST TEXT:", stringListText);
                    stringListText.split("\n").map((str=>
                    {
                        str = str.trim();
                        if (str.length)
                        {
                            stringListValues.push(str);
                        }
                    }));
                    console.log(stringListValues);
                    myObj.Value=stringListValues;
//                        myObj["value"] = $(this).find(".playerAttributeForm-"+attributeType+"-value").val();
                }
                if (attributeType=="SDM")
                {
                    let myMap = {};
                    $(this).find(".stringDoubleMapValue").each(function(ind)
                    {
                        let mapKey = $(this).find(".playerAttributeForm-"+attributeType+"-value-key").val() as string;
                        let mapValue = $(this).find(".playerAttributeForm-"+attributeType+"-value-value").val() as number;
                        myMap[mapKey] = mapValue;
                    });
                    myObj.ValueMap = myMap;
                }
            }
            playerAttributes.push(myObj);
            console.log(myObj);
            //console.log($( this ).html());
        });

    }

    constructPlayerProfileObject = () =>
    {
        let playerProfile: DataTypes.PlayerProfile = {
            Name: $('#playerProfileName').val() as string,
            Attributes: null
        };

        if (playerProfile.Name=="")
        {
            this.showFailureAlert("You must specify a name for your profile!")
            return null;
        }
        let playerAttributes:PlayerProfileAttribute[] = [];
        $( "#playerProfileAttributes div.playerAttribute" ).each(function() {
            let attributeName = $(this).find("input.playerAttributeForm-name").val() as string;

            if (attributeName.length==0)
            {
                $(this).find("input.playerAttributeForm-name").addClass("errorBorder");
                return null;
            }
            else
            {
                $(this).find("input.playerAttributeForm-name").removeClass("errorBorder");
            }
            let attributeType = $(this).find("select.attributeType").val();
            console.log(attributeType);
            let valueType = $(this).find(".playerAttributeForm-"+attributeType).find("select.valueType").val();
            console.log(valueType);

            let myObj: PlayerProfileAttribute = {
                AttributeName:attributeName as string,
                AttributeType:attributeType as string,
                Value:"",
                ValueType:valueType as string,
                ValueMap:{},
            };

            if (valueType=="randomInteger")
            {
                myObj.Min = parseInt($(this).find(".playerAttributeForm-"+attributeType+"-value-min").val() as string);
                myObj.Max = parseInt($(this).find(".playerAttributeForm-"+attributeType+"-value-max").val() as string);
            }
            else
            if (valueType=="randomDouble")
            {
                myObj.Min = parseFloat($(this).find(".playerAttributeForm-"+attributeType+"-value-min").val() as string);
                myObj.Max = parseFloat($(this).find(".playerAttributeForm-"+attributeType+"-value-max").val() as string);
            }
            if (valueType=="randomStringList" && attributeType=="SL")
            {
                myObj.Min = parseFloat($(this).find(".playerAttributeForm-"+attributeType+"-randomStringList-min").val() as string);
                myObj.Max = parseFloat($(this).find(".playerAttributeForm-"+attributeType+"-randomStringList-max").val() as string);

                if (attributeType=="SL")
                {
                    let stringListValues = [];
                    let stringListText = $(this).find(".playerAttributeForm-"+attributeType+"-randomStringList-value").val() as string;
                    stringListText.split("\n").map((str=>
                    {
                        str = str.trim();
                        if (str.length)
                        {
                            stringListValues.push(str);
                        }
                    }));
                    myObj.Value=stringListValues;
                }
            }
            else if (valueType=="value")
            {
                if (attributeType=="N")
                {
                    myObj.Value = parseInt($(this).find(".playerAttributeForm-"+attributeType+"-value-value").val() as string);
                }

                if (attributeType=="S")
                {
                    myObj.Value = $(this).find(".playerAttributeForm-"+attributeType+"-value-value").val();
                }
                if (attributeType=="SL")
                {
                    let stringListValues = [];
                    let stringListText = $(this).find(".playerAttributeForm-"+attributeType+"-value-value").val() as string;
                    stringListText.split("\n").map((str=>
                    {
                        str = str.trim();
                        if (str.length)
                        {
                            stringListValues.push(str);
                        }
                    }));
                    myObj.Value=stringListValues;
                }
                if (attributeType=="SDM")
                {
                    let myMap = {};
                    $(this).find(".stringDoubleMapValue").each(function(ind)
                    {
                        let mapKey = $(this).find(".playerAttributeForm-"+attributeType+"-value-key").val() as string;
                        let mapValue = $(this).find(".playerAttributeForm-"+attributeType+"-value-value").val() as number;
                        myMap[mapKey] = mapValue;
                    });
                    myObj.ValueMap = myMap;
                }
            }
            playerAttributes.push(myObj);
            //console.log($( this ).html());
        });


        playerProfile.Attributes = playerAttributes;

        let playerTeam = $('#playerTeamName').val() as string;
        playerTeam = playerTeam.trim();
        if (playerTeam.length)
        {
            playerProfile.Team = playerTeam;
        }

        let profileId = $('#playerProfileId').val() as string;
        if (profileId.length)
        {
            playerProfile.ProfileId = profileId;
        }

        console.log(playerProfile);

        return playerProfile;
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);
        console.log(el);

        if (el.hasClass("deleteAttribute"))
        {
            el.parent().parent().parent().remove();
        }
        if (el.attr("id")=="createPlayerProfile")
        {
            this.hideStatusAlert();

            console.log("CREATE PLAYER PROFILE!");
            let playerProfile = this.constructPlayerProfileObject();
            console.log(playerProfile);
            if (playerProfile!=null)
            {
                Network.sendObject({Type:"SavePlayerProfile", Profile:playerProfile});
            }
        }

        if (el.hasClass("editPlayerProfile"))
        {
            this.resetPlayerProfileForm();
            this.showEditPlayerProfileForm(el.attr("id"));
        }
        if (el.hasClass("deletePlayerProfile"))
        {
            Network.sendObject({Type:"DeletePlayerProfile", ProfileId:el.attr("id")});
        }
        if (el.attr("id")=="addPlayerProfileAttribute")
        {
            console.log("ADD PLAYER PROFILE ATTRIBUTE");
            this.addNewPlayerProfileAttribute();
            /*
            let addedEl = $('#playerProfileAttributes').append($('#playerAttributeTemplate').html());
            console.log(addedEl);

             */
        }
        if (el.hasClass("addStringDoubleMapValue"))
        {
            el.parent().parent().parent().parent().append(this.getStringDoubleMapValueHtml());

            console.log("ADD STRING DOUBLE MAP VALUE!");
        }
        if (el.hasClass("removeStringDoubleMapValue"))
        {
            console.log("REMOVE STRING DOUBLE MAP VALUE!");
            el.parent().parent().parent().remove();
        }
        else if (event.target.id=="showCreatePlayerProfileFormButton")
        {
            this.resetPlayerProfileForm();
            this.showCreatePlayerProfileForm();
        }

        else if (event.target.id=="backToPlayerProfiles")
        {
            this.showPlayerProfileList();
        }
    }

    getStringDoubleMapValueHtml()
    {
        return '<div class="stringDoubleMapValue">' +
            '<div class="float-left" style="clear:both;">\n' +
            '<input class="playerAttributeForm-SDM-value-key" type="text" />\n' +
            '</div>' +
            '<div class="float-left">\n' +
            '<input class="playerAttributeForm-SDM-value-value" type="number" />\n' +
            '                <div class="removeStringDoubleMapValueContainer">\n' +
            '                    <a href="#" class="removeStringDoubleMapValue">-</a>\n' +
            '                </div>' +
            '</div>' +
            '</div>'
    }

    addNewPlayerProfileAttribute()
    {
        $.get('assets/html/fragments/playerAttributeTemplate.html', (data) => {

            let addedEl = $(data).appendTo("#playerProfileAttributes");
            addedEl.find('.playerAttributeForm-S').show();
            addedEl.find('.playerAttributeForm-N').hide();
            addedEl.find('.playerAttributeForm-SL').hide();
            addedEl.find('.playerAttributeForm-SDM').hide();

            $('.attributeType').off("change", this.onAttributeTypeChange);
            $('.attributeType').on("change", this.onAttributeTypeChange);
            $('.valueType').off("change", this.onValueTypeChange);
            $('.valueType').on("change", this.onValueTypeChange);
        });
    }

    addPlayerProfileAttribute(attribute:PlayerProfileAttribute)
    {
        $.get('assets/html/fragments/playerAttributeTemplate.html', (data) => {

            console.log("ADDING ATTRIBUTE", attribute);
            let addedEl = $(data).appendTo("#playerProfileAttributes");
            addedEl.find('.playerAttributeForm-S').hide();
            addedEl.find('.playerAttributeForm-N').hide();
            addedEl.find('.playerAttributeForm-SL').hide();
            addedEl.find('.playerAttributeForm-M').hide();
            addedEl.find('.playerAttributeForm-SDM').hide();

            addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value").hide();
            addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-values").hide();
            addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-randomInteger").hide();

            addedEl.find('input.playerAttributeForm-name').val(attribute.AttributeName);
            addedEl.find("select.attributeType").val(attribute.AttributeType);

            addedEl.find('.playerAttributeForm-' + attribute.AttributeType + ' select.valueType').val(attribute.ValueType);

            if (attribute.ValueType=="randomInteger" || attribute.ValueType=="randomDouble")
            {
                addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-min").val(attribute.Min);
                addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-max").val(attribute.Max);
            }
            else
            if (attribute.AttributeType=="SL")
            {
                let valueArray = attribute.Value as string[];
                let stringList="";
                for (let i=0; i<valueArray.length; i++)
                {
                    stringList += valueArray[i] + "\n";
                    /*                        if (i==0)
                                            {
                                            }
                                            else
                                            {
                                                let newEl = $(this.getStringListValueHtml());
                                                newEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-value").val(valueArray[i]);
                                                newEl.appendTo(addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value"));
                                            }

                     */
                }
                if (attribute.ValueType=="randomStringList")
                {
                    addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-" + attribute.ValueType + "-min").val(attribute.Min);
                    addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-" + attribute.ValueType + "-max").val(attribute.Max);
                    addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-" + attribute.ValueType+ "-value").html(stringList);
                }
                else
                if (attribute.ValueType=="value")
                {
                    addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-" + attribute.ValueType+ "-value").html(stringList);
                }
            }
            else if (attribute.ValueType=="value")
            {
                if (attribute.AttributeType=="N" || attribute.AttributeType=="S")
                {
                    addedEl.find(".playerAttributeForm-"+ attribute.AttributeType + "-value-value").val(attribute.Value);
                }
                else
                if (attribute.AttributeType=="SDM")
                {
                    let valueMap = attribute.ValueMap as Record<string, number>;
                    let i=0;
                    Object.keys(valueMap).map(key=>
                    {
                        if (i==0)
                        {
                            addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-key").val(key);
                            addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-value").val(valueMap[key]);
                        }
                        else
                        {
                            let newEl = $(this.getStringDoubleMapValueHtml());
                            newEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-key").val(key);
                            newEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value-value").val(valueMap[key]);
                            newEl.appendTo(addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-value"));
                        }
                        i++;
                    });
                }
            }


            addedEl.find(".playerAttributeForm-" + attribute.AttributeType + "-"+attribute.ValueType).show();

            addedEl.find('.playerAttributeForm-' + attribute.AttributeType).show();
            addedEl.find('.playerAttributeForm-' + attribute.AttributeType).show();

            $('.attributeType').off("change", this.onAttributeTypeChange);
            $('.attributeType').on("change", this.onAttributeTypeChange);
            $('.valueType').off("change", this.onValueTypeChange);
            $('.valueType').on("change", this.onValueTypeChange);
        });
    }

    showCreatePlayerProfileForm()
    {
        $('.playerProfileForm').show();
        $('.playerProfilesTableContainer').hide();
    }

    showEditPlayerProfileForm(profileId:string)
    {
        let profile = this._playerProfiles[profileId];
        console.log(profile);
        this.resetPlayerProfileForm();

        $('.playerProfileForm input#playerProfileId').val(profile.ProfileId);
        $('.playerProfileForm input#playerProfileName').val(profile.Name);
        console.log(profile.Team);
        if (profile.Team!=null)
        {
            $('.playerProfileForm input#playerTeamName').val(profile.Team);
        }
        profile.Attributes.map(attribute => this.addPlayerProfileAttribute(attribute));

        $('.playerProfileForm').show();
        $('.playerProfilesTableContainer').hide();
    }

    showPlayerProfileList()
    {
        $('.playerProfileForm').hide();
        $('.playerProfilesTableContainer').show();
    }

    resetJson()
    {
        $('#'+this._parentDomId).find("#ruleSetJson").html("");
    }

    activateDataTable(id) {
        console.log($('#'+id).html());

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