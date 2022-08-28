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

        this._popup.node.querySelector("p.title").insertAdjacentHTML("beforeend", "Update Locations for Fleet \"" + this._fleetData.FleetAttributes.Name + "\"");

        const homeRegionCode = this._fleetData.FleetUtilization.Location;
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        td1.textContent="Home region " + homeRegionCode;
        tr.append(td1);
        tr.append(document.createElement("td"))
        document.querySelector("#fleetLocationsTable").append(tr);

        let activeLocations = this.getActiveLocations();

        Locations.Locations.map(locationRecord=>
        {
           if (locationRecord.regionCode != homeRegionCode)
           {
               let tr = document.createElement('tr');
               let td1 = document.createElement('td');
               td1.textContent=locationRecord.regionCode + " - " + locationRecord.regionTitle;
               tr.append(td1);
               let td2 = document.createElement('td');
               let checkbox = document.createElement("input");
               checkbox.setAttribute("type", "checkbox");
               checkbox.setAttribute("id", "location-" + locationRecord.regionCode);
               if (activeLocations.indexOf(locationRecord.regionCode)!==-1)
               {
                   checkbox.checked=true;
               }
               td2.append(checkbox);
               //td2.textContent=destination.DestinationArn;
               tr.append(td2);
               document.querySelector("#fleetLocationsTable").append(tr);
           }
        });
    }

    onUpdateLocationsResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this._popup.node.querySelector("div.alert").innerHTML = "Fleet locations updated!";
            this._popup.node.querySelector("div.alert").className = "alert alert-success p-1";
        }
        else
        {
            this._popup.node.querySelector("div.alert").innerHTML = response.Errors.join("<br/>");
            this._popup.node.querySelector("div.alert").className = "alert alert-danger p-1";

        }
    };

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
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
                    let isChecked = (this._popup.node.querySelector("#location-" + locationRecord.regionCode) as HTMLInputElement).checked;

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
                this._popup.node.querySelector("div.alert").innerHTML = "No changes!";
                this._popup.node.querySelector("div.alert").className = "alert alert-danger p-1";
            }
            else
            {
                this._popup.node.querySelector("div.alert").innerHTML = "Updating locations...";
                this._popup.node.querySelector("div.alert").className = "alert p-1";

                let changeRequest = {Type:"UpdateFleetLocations", FleetId: this._fleetData.FleetId, AddedLocations : addedLocations, RemovedLocations: removedLocations};
                Network.sendObject(changeRequest);
            }
        }
    }
}