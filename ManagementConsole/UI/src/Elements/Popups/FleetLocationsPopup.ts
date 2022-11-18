// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import FleetData = DataTypes.FleetData;
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import {Locations} from "../../Data/Locations";
import SimpleResult = DataTypes.SimpleResult;

export class FleetLocationsPopup extends Popup
{
    protected _fleetData:FleetData;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="fleetLocationsPopup";
        this.setupEventListeners();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.UPDATE_FLEET_LOCATIONS_RESPONSE, this.onUpdateLocationsResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.UPDATE_FLEET_LOCATIONS_RESPONSE, this.onUpdateLocationsResponse);
    }

    getActiveLocations()
    {
        let activeLocations = [];
        this._fleetData.LocationAttributes.map((locationAttribute)=>
        {
            if (this._fleetData.FleetUtilization.Location!=locationAttribute.LocationState.Location)
            {
                activeLocations.push(locationAttribute.LocationState.Location);
            }
        })
        return activeLocations;
    }

    setPopupData(data:PopupClickEvent)
    {
        this._fleetData = data.gameObject.Data as FleetData;

        this.element.find("p.title").append("Update Locations for Fleet \"" + this._fleetData.FleetAttributes.Name + "\"");

        const homeRegionCode = this._fleetData.FleetUtilization.Location;

        let row = '<tr><td>' + "" + 'Home region ' + homeRegionCode + '</td><td></td></tr>';
        this.element.find('#fleetLocationsTable').append(row);

        let activeLocations = this.getActiveLocations();

        Locations.Locations.map(locationRecord=>
        {
           if (locationRecord.regionCode != homeRegionCode)
           {
               let regionTitle=locationRecord.regionCode + " - " + locationRecord.regionTitle;

               let checkboxAttributes = {
                   type: 'checkbox',
                   id: 'location-' + locationRecord.regionCode
               };

               if (activeLocations.indexOf(locationRecord.regionCode)!==-1) {
                   checkboxAttributes["checked"] = 'checked';
               }

               let row='<tr><td>' + regionTitle + '</td><td>' + $('<input>', checkboxAttributes).prop("outerHTML") + '</td></tr>';
               this.element.find('#fleetLocationsTable').append(row);
           }
        });
    }

    onUpdateLocationsResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this.element.find('div.alert').html('Fleet locations updated!');
            this.element.find('div.alert').attr("class", "alert alert-success p-1");
        }
        else
        {
            this.element.find('div.alert').html(response.Errors.join("<br/>"));
            this.element.find('div.alert').attr("class", "alert alert-danger p-1");

        }
    };

    onPopupClick = async (event) => {

        event.stopPropagation();
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }

        if (event.target.id=="updateLocationsButton")
        {
            let activeLocations = this.getActiveLocations();
            let addedLocations = [];
            let removedLocations = [];
            Locations.Locations.map(locationRecord=>
            {
                if (this._fleetData.FleetUtilization.Location!=locationRecord.regionCode)
                {
                    let isChecked = (this.element.find("#location-" + locationRecord.regionCode)[0] as HTMLInputElement).checked;

                    if (isChecked && activeLocations.indexOf(locationRecord.regionCode)===-1)
                    {
                        addedLocations.push(locationRecord.regionCode);
                    }
                    else
                    if (!isChecked && activeLocations.indexOf(locationRecord.regionCode)!==-1)
                    {
                        removedLocations.push(locationRecord.regionCode);
                    }
                }
            });

            if (addedLocations.length==0 && removedLocations.length==0)
            {
                this.element.find('div.alert').html('No changes!');
                this.element.find('div.alert').attr("class", "alert alert-danger p-1");
            }
            else
            {
                this.element.find('div.alert').html('Updating locations...');
                this.element.find('div.alert').attr("class", "alert p-1");

                let changeRequest = {Type:"UpdateFleetLocations", FleetId: this._fleetData.FleetId, AddedLocations : addedLocations, RemovedLocations: removedLocations};
                Network.sendObject(changeRequest);
            }
        }
    }
}