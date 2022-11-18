// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {Popup} from "../Abstract/Popup";
import {PopupClickEvent} from "../../Events/PopupClickEvent";
import FleetData = DataTypes.FleetData;
import SimpleResult = DataTypes.SimpleResult;
import {Utils} from "../../Utils/Utils";

export class FleetScalingPopup extends Popup
{
    protected _fleetData:FleetData;
    protected _scalingData;

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="fleetScalingPopup";
        this.setupEventListeners();
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_FLEET_SCALING_RESPONSE, this.onGetFleetScalingResponse);
        this._emitter.on(Events.ADJUST_FLEET_SCALING_RESPONSE, this.onFleetScalingResponse);
        this._emitter.on(Events.DELETE_SCALING_POLICY_RESPONSE, this.onDeleteScalingPolicyResponse);
        this._emitter.on(Events.SET_SCALING_POLICY_RESPONSE, this.onSetScalingPolicyResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_FLEET_SCALING_RESPONSE, this.onGetFleetScalingResponse);
        this._emitter.off(Events.ADJUST_FLEET_SCALING_RESPONSE, this.onFleetScalingResponse);
        this._emitter.off(Events.DELETE_SCALING_POLICY_RESPONSE, this.onDeleteScalingPolicyResponse);
        this._emitter.off(Events.SET_SCALING_POLICY_RESPONSE, this.onSetScalingPolicyResponse);
    }

    setPopupData(data:PopupClickEvent)
    {

        this._fleetData = data.gameObject.Data as FleetData;

        Network.sendObject({Type:"GetFleetScaling", FleetId:this._fleetData.FleetId});

    }

    onFleetScalingResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this.element.find("#capacityAlert").html("Fleet capacities updated!");
            this.element.find("#capacityAlert").attr("class", "alert alert-success p-1");
        }
        else
        {
            this.element.find("#capacityAlert").html(response.Errors.join("<br/>"));
            this.element.find("#capacityAlert").attr("class", "alert alert-danger p-1");

        }
    };

    onSetScalingPolicyResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this.element.find("#scalingAlert").html("Scaling policy updated!");
            this.element.find("#scalingAlert").attr("class", "alert alert-success p-1");
        }
        else
        {
            this.element.find("#scalingAlert").html(response.Errors.join("<br/>"));
            this.element.find("#scalingAlert").attr("class", "alert alert-danger p-1");

        }
    };

    onDeleteScalingPolicyResponse = async (response:SimpleResult) =>
    {
        if (response.Errors.length==0)
        {
            this.element.find("#scalingAlert").html("Scaling policy deleted!");
            this.element.find("#scalingAlert").attr("class", "alert alert-success p-1");
        }
        else
        {
            this.element.find("#scalingAlert").html(response.Errors.join("<br/>"));
            this.element.find("#scalingAlert").attr("class", "alert alert-danger p-1");

        }
    };

    resetElement(selector)
    {
        let el = $(this._html);
        this.element.find(selector).html(el.find(selector).html());
    }

    onGetFleetScalingResponse = (data) =>
    {
        this.resetElement(".fleetScalingPopup");
        this._scalingData = data;

        const activeScalingPolicies = data.ScalingPolicies.filter(scalingPolicy=>scalingPolicy.Status.Value=="ACTIVE" && scalingPolicy.PolicyType.Value=="TargetBased")

        this.element.find("p.title").append("Adjust Scaling for Fleet \"" + this._fleetData.FleetAttributes.Name + "\"");

        data.FleetCapacities.map(locationCapacity=>{
            const tr = '<tr><td>' + locationCapacity.Location + '</td>' +
                '<td>Min: <input style="max-width:50px" id="' + locationCapacity.Location + '-min" type="number" value="' + locationCapacity.InstanceCounts.MINIMUM + '"/> </td>' +
                '<td>Desired: <input style="max-width:50px" id="' + locationCapacity.Location + '-desired" type="number" value="' + locationCapacity.InstanceCounts.DESIRED + '"/> </td>' +
                '<td>Max: <input style="max-width:50px" id="' + locationCapacity.Location + '-max" type="number" value="' + locationCapacity.InstanceCounts.MAXIMUM + '"/> </td></tr>';
            this.element.find("#fleetScalingTable").append(tr);
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

        this.element.find("#scalingPoliciesTable").append(scalingPolicyHtml);

    };

    onPopupClick = async (event) => {

        event.stopPropagation();

        if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }

        const activeScalingPolicies = this._scalingData.ScalingPolicies.filter(scalingPolicy=>scalingPolicy.Status.Value=="ACTIVE" && scalingPolicy.PolicyType.Value=="TargetBased")

        if (event.target.id=="setScalingPolicyButton")
        {
            this.element.find("#scalingAlert").html("");
            this.element.find("#scalingAlert").attr("class", "alert p-1");

            let enabled = (this.element.find("#scalingEnabled")[0] as HTMLInputElement).checked;
            let scalingTarget = parseInt((this.element.find("#scalingTarget")[0] as HTMLInputElement).value, 10);
            if (!enabled && activeScalingPolicies.length > 0) // need to delete scaling policy
            {
                Network.sendObject({Type:"DeleteScalingPolicy", FleetId:this._fleetData.FleetId, Name:activeScalingPolicies[0].Name})
                setTimeout(()=>
                {
                    Network.sendObject({Type:"GetFleetScaling", FleetId:this._fleetData.FleetId});
                }, 3000);
            }
            else
            if ((enabled && activeScalingPolicies.length==0) || (activeScalingPolicies.length>0 && activeScalingPolicies[0].TargetConfiguration.TargetValue!=scalingTarget)) // need to put scaling policy
            {
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
                setTimeout(()=>
                {
                    Network.sendObject({Type:"GetFleetScaling", FleetId:this._fleetData.FleetId});
                }, 3000);
            }
            else // no changes
            {
                this.element.find("#scalingAlert").html("No changes, or scaling policy may be in the process of updating");
                this.element.find("#scalingAlert").attr("class", "alert alert-danger p-1");
            }
        }

        if (event.target.id=="adjustCapacityButton")
        {
            let changes=[];
            this._scalingData.FleetCapacities.map(locationCapacity=>
            {
                let min = parseInt((this.element.find("#" + locationCapacity.Location + "-min")[0] as HTMLInputElement).value);
                let desired = parseInt((this.element.find("#" + locationCapacity.Location + "-desired")[0] as HTMLInputElement).value);
                let max = parseInt((this.element.find("#" + locationCapacity.Location + "-max")[0] as HTMLInputElement).value);

                if (min!=locationCapacity.InstanceCounts.MINIMUM || desired!=locationCapacity.InstanceCounts.DESIRED || max!=locationCapacity.InstanceCounts.MAXIMUM)
                {
                    changes.push({Min: min, Max: max, Desired: desired, Location: locationCapacity.Location, FleetId:this._fleetData.FleetId});
                }
            });

            if (changes.length==0)
            {
                this.element.find("#capacityAlert").html("No changes!");
                this.element.find("#capacityAlert").attr("class", "alert alert-danger p-1");
            }
            else
            {
                this.element.find("#capacityAlert").html("Adjusting scale...");
                this.element.find("#capacityAlert").attr("class", "alert p-1");

                let changeRequest = {Type:"AdjustFleetCapacity", Changes : changes};
                Network.sendObject(changeRequest);
            }
        }

    }
}