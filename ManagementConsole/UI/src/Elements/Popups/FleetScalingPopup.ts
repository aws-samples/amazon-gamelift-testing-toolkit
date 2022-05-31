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
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import FleetData = DataTypes.FleetData;
import SimpleResult = DataTypes.SimpleResult;

export class FleetScalingPopup extends Popup
{
    protected _fleetData:FleetData;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="fleetScalingPopup";
        this.setupEventListeners();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.ADJUST_FLEET_SCALING_RESPONSE, this.onFleetScalingResponse);
        this._emitter.on(Events.DELETE_SCALING_POLICY_RESPONSE, this.onDeleteScalingPolicyResponse);
        this._emitter.on(Events.SET_SCALING_POLICY_RESPONSE, this.onSetScalingPolicyResponse);
    }

    removeEventListeners()
    {
        console.log("REMOVING EVENT LISTENERS!");
        this._emitter.off(Events.ADJUST_FLEET_SCALING_RESPONSE, this.onFleetScalingResponse);
        this._emitter.off(Events.DELETE_SCALING_POLICY_RESPONSE, this.onDeleteScalingPolicyResponse);
        this._emitter.off(Events.SET_SCALING_POLICY_RESPONSE, this.onSetScalingPolicyResponse);
    }

    setPopupData(data:PopupClickEvent)
    {
        this._fleetData = data.gameObject.Data as FleetData;
        const activeScalingPolicies = this._fleetData.ScalingPolicies.filter(scalingPolicy=>scalingPolicy.Status.Value=="ACTIVE")

        console.log(this._fleetData.ScalingPolicies);

        this._popup.node.querySelector("p.title").insertAdjacentHTML("beforeend", "Adjust Scaling for Fleet \"" + this._fleetData.FleetAttributes.Name + "\"");

        this._fleetData.LocationCapacities.map(locationCapacity=>{
            const tr = '<tr><td>' + locationCapacity.Location + '</td>' +
                '<td>Min: <input style="max-width:50px" id="' + locationCapacity.Location + '-min" type="number" value="' + locationCapacity.InstanceCounts.MINIMUM + '"/> </td>' +
                '<td>Desired: <input style="max-width:50px" id="' + locationCapacity.Location + '-desired" type="number" value="' + locationCapacity.InstanceCounts.DESIRED + '"/> </td>' +
                '<td>Max: <input style="max-width:50px" id="' + locationCapacity.Location + '-max" type="number" value="' + locationCapacity.InstanceCounts.MAXIMUM + '"/> </td></tr>';
            this._popup.node.querySelector("#fleetScalingTable").insertAdjacentHTML("beforeend", tr);
        });

        let scalingTargetValue=15;
        let scalingPolicyHtml = '<tr><td>Scaling Enabled? ';
        if (activeScalingPolicies.length) {
            scalingPolicyHtml += '<input id="scalingEnabled" type="checkbox" checked="checked"/>';
            scalingTargetValue = activeScalingPolicies[0].TargetConfiguration.TargetValue;
        }
        else {
            scalingPolicyHtml += '<input id="scalingEnabled" type="checkbox" />';
        }

        scalingPolicyHtml += '</td><td>Maintain a buffer of <input style="max-width:50px" id="scalingTarget" type="number" value="'+scalingTargetValue.toString()+'"/> percent game session availability</td></tr>';

        this._popup.node.querySelector("#scalingPoliciesTable").insertAdjacentHTML("beforeend", scalingPolicyHtml);


        /*
        fleetData..map(locationAttribute=>
        {
           locationAttribute.LocationState.
        });
        const homeRegionCode = fleetData.FleetUtilization.Location;
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        td1.textContent="Home region " + homeRegionCode;
        tr.append(td1);
        tr.append(document.createElement("td"))
        document.querySelector("#fleetLocationsTable").append(tr);



        let activeInstances:number = 0;
        fleetData.Instances.map((instance)=>
        {
            if (instance.Status.Value=="ACTIVE")
            {
                activeInstances++;
            }
        });

        this._popup.getChildByID("fleetName").innerHTML=fleetData.FleetAttributes.Name;
        this._popup.getChildByID("fleetId").innerHTML=fleetData.FleetId;
        this._popup.getChildByID("fleetArn").innerHTML=fleetData.FleetAttributes.FleetArn;
        this._popup.getChildByID("fleetRegion").innerHTML=fleetData.FleetUtilization.Location;
        this._popup.getChildByID("fleetInstanceType").innerHTML=fleetData.FleetAttributes.InstanceType.Value;
        this._popup.getChildByID("fleetOs").innerHTML=fleetData.FleetAttributes.OperatingSystem.Value;
        this._popup.getChildByID("fleetActiveInstances").innerHTML=activeInstances.toString();
        this._popup.getChildByID("fleetActiveGameSessions").innerHTML=fleetData.FleetUtilization.ActiveGameSessionCount.toString();
        this._popup.getChildByID("fleetCurrentPlayerSessions").innerHTML=fleetData.FleetUtilization.CurrentPlayerSessionCount+"/"+fleetData.FleetUtilization.MaximumPlayerSessionCount;

         */
    }

    onFleetScalingResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this._popup.node.querySelector("#capacityAlert").innerHTML = "Fleet capacities updated!";
            this._popup.node.querySelector("#capacityAlert").className = "alert alert-success p-1";
        }
        else
        {
            this._popup.node.querySelector("#capacityAlert").innerHTML = response.Errors.join("<br/>");
            this._popup.node.querySelector("#capacityAlert").className = "alert alert-danger p-1";

        }
    };

    onSetScalingPolicyResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this._popup.node.querySelector("#scalingAlert").innerHTML = "Scaling policy updated!";
            this._popup.node.querySelector("#scalingAlert").className = "alert alert-success p-1";
        }
        else
        {
            this._popup.node.querySelector("#scalingAlert").innerHTML = response.Errors.join("<br/>");
            this._popup.node.querySelector("#scalingAlert").className = "alert alert-danger p-1";

        }
    };

    onDeleteScalingPolicyResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this._popup.node.querySelector("#scalingAlert").innerHTML = "Scaling policy deleted!";
            this._popup.node.querySelector("#scalingAlert").className = "alert alert-success p-1";
        }
        else
        {
            this._popup.node.querySelector("#scalingAlert").innerHTML = response.Errors.join("<br/>");
            this._popup.node.querySelector("#scalingAlert").className = "alert alert-danger p-1";

        }
    };

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        console.log(event.target.id);
        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }

        const activeScalingPolicies = this._fleetData.ScalingPolicies.filter(scalingPolicy=>scalingPolicy.Status.Value=="ACTIVE")

        console.log("ACTIVE POLICIES", activeScalingPolicies);

        if (event.target.id=="setScalingPolicyButton")
        {
            this._popup.node.querySelector("#scalingAlert").innerHTML = "";
            this._popup.node.querySelector("#scalingAlert").className = "alert p-1";

            let enabled = (this._popup.node.querySelector("#scalingEnabled") as HTMLInputElement).checked;
            let scalingTarget = parseInt((this._popup.node.querySelector("#scalingTarget") as HTMLInputElement).value, 10);
            if (!enabled && activeScalingPolicies.length > 0) // need to delete scaling policy
            {
                console.log("SHOULD DELETE POLICY", activeScalingPolicies[0].Name);
                Network.sendObject({Type:"DeleteScalingPolicy", FleetId:this._fleetData.FleetId, Name:activeScalingPolicies[0].Name})

            }
            else
            if ((enabled && activeScalingPolicies.length==0) || (activeScalingPolicies.length>0 && activeScalingPolicies[0].TargetConfiguration.TargetValue!=scalingTarget)) // need to put scaling policy
            {
                console.log("SHOULD UPDATE/SET POLICY!");
                Network.sendObject({
                    Type:"SetScalingPolicy",
                    FleetId:this._fleetData.FleetId,
                    Name:"targetBasedPolicy",
                    MetricName:"PercentAvailableGameSessions",
                    TargetConfiguration:{
                        TargetValue: scalingTarget
                    },
                    PolicyType:"TargetBased"
                });
            }
            else // no changes
            {
                this._popup.node.querySelector("#scalingAlert").innerHTML = "No changes!";
                this._popup.node.querySelector("#scalingAlert").className = "alert alert-danger p-1";
            }
        }

        if (event.target.id=="adjustCapacityButton")
        {
            let changes=[];
            this._fleetData.LocationCapacities.map(locationCapacity=>
            {
                let min = parseInt((this._popup.node.querySelector("#" + locationCapacity.Location + "-min") as HTMLInputElement).value);
                let desired = parseInt((this._popup.node.querySelector("#" + locationCapacity.Location + "-desired") as HTMLInputElement).value);
                let max = parseInt((this._popup.node.querySelector("#" + locationCapacity.Location + "-max") as HTMLInputElement).value);

                if (min!=locationCapacity.InstanceCounts.MINIMUM || desired!=locationCapacity.InstanceCounts.DESIRED || max!=locationCapacity.InstanceCounts.MAXIMUM)
                {
                    changes.push({Min: min, Max: max, Desired: desired, Location: locationCapacity.Location, FleetId:this._fleetData.FleetId});
                }
//                console.log(locationCapacity.Location, min, desired, max);
            });

            if (changes.length==0)
            {
                this._popup.node.querySelector("#capacityAlert").innerHTML = "No changes!";
                this._popup.node.querySelector("#capacityAlert").className = "alert alert-danger p-1";
            }
            else
            {
                this._popup.node.querySelector("#capacityAlert").innerHTML = "Adjusting scale...";
                this._popup.node.querySelector("#capacityAlert").className = "alert p-1";

                let changeRequest = {Type:"AdjustFleetCapacity", Changes : changes};
                Network.sendObject(changeRequest);
            }
            console.log(changes);
        }

    }
}