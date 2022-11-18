// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {SubPopup} from "../Abstract/SubPopup";
import LatencyProfile = DataTypes.LatencyProfile;
import RegionLatency = DataTypes.RegionLatency;
import {Locations} from "../../Data/Locations";

export class LatencyProfilesSubPopup extends SubPopup
{
    protected _latencyProfiles: Record<string, LatencyProfile>;
    protected _editor;

    public constructor (url:string, parentDomId:string)
    {
        super(url, parentDomId);
        this._latencyProfiles={};
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetLatencyProfiles"});
    }

    resetTable()
    {
        this.resetElement(".latencyProfilesTableContainer");
    }

    resetLatencyProfileForm()
    {
        this.resetElement(".latencyProfileForm");
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_LATENCY_PROFILES_RESPONSE, this.onGetLatencyProfilesResponse);
        this._emitter.on(Events.SAVE_LATENCY_PROFILE_RESPONSE, this.onSaveLatencyProfileResponse);
        this._emitter.on(Events.DELETE_LATENCY_PROFILE_RESPONSE, this.onDeleteLatencyProfileResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_LATENCY_PROFILES_RESPONSE, this.onGetLatencyProfilesResponse);
        this._emitter.off(Events.SAVE_LATENCY_PROFILE_RESPONSE, this.onSaveLatencyProfileResponse);
        this._emitter.off(Events.DELETE_LATENCY_PROFILE_RESPONSE, this.onDeleteLatencyProfileResponse);
    }

    onSaveLatencyProfileResponse = (data) =>
    {
        if (data.Errors.length==0)
        {
            this.refresh();
            this.showLatencyProfileList();
        }
        else
        {
            this.showFailureAlert(data.Errors[0]);
        }
    }

    onDeleteLatencyProfileResponse = (data) =>
    {
        if (data.Errors.length==0)
        {
            this.refresh();
            this.showLatencyProfileList();
        }
        else
        {
            this.showFailureAlert(data.Errors[0]);
        }
    }

    onGetLatencyProfilesResponse = (data) =>
    {
        let html="";
        this._latencyProfiles={};
        data.map(profile =>
        {
            this._latencyProfiles[profile.ProfileId] = profile;

            let editProfileTd='<td><a class="editLatencyProfile btn btn-primary btn-sm" id="' + profile.ProfileId +'" href="' + "#" + '">Edit Profile</a></td>';
            let deleteProfileTd='<td><a class="deleteLatencyProfile btn btn-primary btn-sm" id="' + profile.ProfileId +'" href="' + "#" + '">Delete Profile</a></td>';

            html += '<tr>' +
                '<td>' + profile.Name + '</td>'+
                '<td>' + profile.LatencyData.length + '</td>'+
                editProfileTd +
                deleteProfileTd +
                '</tr>';
        });
        this.resetTable();
        $("table#latencyProfilesTable tbody").append( html);
        this.activateDataTable("latencyProfilesTable");
    }

    constructLatencyProfileObject = () =>
    {
        let latencyProfile: DataTypes.LatencyProfile = {
            Name: $('#latencyProfileName').val() as string,
            LatencyData: null
        };

        if (latencyProfile.Name=="")
        {
            this.showFailureAlert("You must specify a name for your profile!")
            return null;
        }
        let latencyData:RegionLatency[] = [];
        $( "#latencyProfileAttributes div.regionLatency" ).each(function() {
            let regionName = $(this).find("select.regionLatencyForm-name").val() as string;
            let minLatency = $(this).find("input.regionLatencyForm-minLatency").val() as number;
            let maxLatency = $(this).find("input.regionLatencyForm-maxLatency").val() as number;

            let myObj: RegionLatency = {
                Region:regionName as string,
                MinLatency:minLatency,
                MaxLatency:maxLatency,
            };

            latencyData.push(myObj);
        });

        latencyProfile.LatencyData = latencyData;

        let profileId = $('#latencyProfileId').val() as string;
        if (profileId.length)
        {
            latencyProfile.ProfileId = profileId;
        }

        return latencyProfile;
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (el.hasClass("deleteRegionLatency"))
        {
            el.parent().parent().parent().remove();
            this.updateAvailableLocations();
        }
        if (el.attr("id")=="createLatencyProfile")
        {
            this.hideStatusAlert();

            let latencyProfile = this.constructLatencyProfileObject();
            if (latencyProfile!=null)
            {
                Network.sendObject({Type:"SaveLatencyProfile", Profile:latencyProfile});
            }
        }

        if (el.hasClass("editLatencyProfile"))
        {
            this.resetLatencyProfileForm();
            this.showEditLatencyProfileForm(el.attr("id"));
        }
        if (el.hasClass("deleteLatencyProfile"))
        {
            Network.sendObject({Type:"DeleteLatencyProfile", ProfileId:el.attr("id")});
        }
        if (el.attr("id")=="addLatencyProfileAttribute")
        {
            this.addNewLatencyProfileAttribute();
        }
        if (el.hasClass("addStringDoubleMapValue"))
        {
            el.parent().parent().parent().parent().append(this.getStringDoubleMapValueHtml());
        }
        if (el.hasClass("removeStringDoubleMapValue"))
        {
            el.parent().parent().parent().remove();
        }
        else if (event.target.id=="showCreateLatencyProfileFormButton")
        {
            this.resetLatencyProfileForm();
            this.showCreateLatencyProfileForm();
        }

        else if (event.target.id=="backToLatencyProfiles")
        {
            this.showLatencyProfileList();
        }
    }

    getStringDoubleMapValueHtml()
    {
        return '<div class="stringDoubleMapValue">' +
            '<div class="float-left" style="clear:both;">\n' +
            '<input class="latencyAttributeForm-SDM-value-key" type="text" />\n' +
            '</div>' +
            '<div class="float-left">\n' +
            '<input class="latencyAttributeForm-SDM-value-value" type="number" />\n' +
            '                <div class="removeStringDoubleMapValueContainer">\n' +
            '                    <a href="#" class="removeStringDoubleMapValue">-</a>\n' +
            '                </div>' +
            '</div>' +
            '</div>'
    }

    addNewLatencyProfileAttribute()
    {
        $.get('assets/html/fragments/regionLatencyTemplate.html', (data) => {

            let addedEl = $(data).appendTo("#latencyProfileAttributes");

            addedEl.find("select.regionLatencyForm-name").on("change", ()=>
            {
                this.updateAvailableLocations();
            });

            let locations = this.getAvailableLocations();
            locations.map (location=>
            {
                addedEl.find('.regionLatencyForm-name').append("<option>" + location + "</option>");
            });

            this.updateAvailableLocations();
        });
    }

    getAvailableLocations()
    {
        let availableLocations=[];
        let existingLocations=[];
        $("select.regionLatencyForm-name").each(function ()
        {
            existingLocations.push($(this).val());
        });

        Locations.Locations.map((location)=>
        {
           if (existingLocations.indexOf(location.regionCode)===-1)
           {
                availableLocations.push(location.regionCode);
           }
        });

        return availableLocations;
    }

    updateAvailableLocations()
    {
        let availableLocations = this.getAvailableLocations();
        $("select.regionLatencyForm-name").each(function ()
        {
            let selectedOption = $(this).val();
            $(this).html('<option type="text" value="' + selectedOption + '" selected="selected">' + selectedOption + '</option>');
            availableLocations.map((location)=>
            {
               $(this).append('<option type="text" value="' + location + '">' + location + '</option>');
            });
        });
    }

    addLatencyProfileAttribute(regionLatency:RegionLatency)
    {
        $.get('assets/html/fragments/regionLatencyTemplate.html', (data) => {

            let addedEl = $(data).appendTo("#latencyProfileAttributes");
            let selectEl = $(data).find("select.regionLatencyForm-name")[0];

            addedEl.find("select.regionLatencyForm-name").html('<option type="text" value="' + regionLatency.Region + '" selected="selected">' + regionLatency.Region + '</option>');
            addedEl.find(".regionLatencyForm-minLatency").val(regionLatency.MinLatency);
            addedEl.find(".regionLatencyForm-maxLatency").val(regionLatency.MaxLatency);
            addedEl.find("select.regionLatencyForm-name").on("change", ()=>
            {
                this.updateAvailableLocations();
            });

            this.updateAvailableLocations();
        });
    }

    showCreateLatencyProfileForm()
    {
        $('.latencyProfileForm').show();
        $('.latencyProfilesTableContainer').hide();
    }

    showEditLatencyProfileForm(profileId:string)
    {
        let profile = this._latencyProfiles[profileId];

        this.resetLatencyProfileForm();

        $('.latencyProfileForm input#latencyProfileId').val(profile.ProfileId);
        $('.latencyProfileForm input#latencyProfileName').val(profile.Name);
        profile.LatencyData.map(regionLatency => this.addLatencyProfileAttribute(regionLatency));

        $('.latencyProfileForm').show();
        $('.latencyProfilesTableContainer').hide();
    }

    showLatencyProfileList()
    {
        $('.latencyProfileForm').hide();
        $('.latencyProfilesTableContainer').show();
    }

    resetJson()
    {
        $('#'+this._parentDomId).find("#ruleSetJson").html("");
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