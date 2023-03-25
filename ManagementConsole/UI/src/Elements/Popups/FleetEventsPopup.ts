// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Popup} from "../Abstract/Popup";
import FleetData = DataTypes.FleetData;
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";

export class FleetEventsPopup extends Popup
{
    protected _fleetData:FleetData;
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="fleetEventsPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this._fleetData = data.gameObject.Data as FleetData;

        Network.sendObject({Type:"GetFleetEvents", FleetId:this._fleetData.FleetId});

    }

    loadingComplete()
    {
        this.element.find('.fleetEventsContent').show();
        this.element.find('.loadingMessage').hide();
    }

    onGetFleetEventsResponse = (data:DataTypes.FleetEvent[]) =>
    {
        console.log(data);
        this._fleetData.FleetEvents = data;
        let html="";
        this._fleetData.FleetEvents.map(fleetEvent =>
        {
            let logLinkTd="<td></td>"
            if (fleetEvent.PreSignedLogUrl)
            {
                logLinkTd='<td><a class="btn btn-primary btn-sm" href="' + fleetEvent.PreSignedLogUrl + '">Get Logs</a></td>';
            }

            html += '<tr>' +
                '<td>' + fleetEvent.EventTime + '</td>'+
                '<td>' + fleetEvent.EventCode.Value + '</td>'+
                '<td>' + fleetEvent.Message + '</td>' +
                logLinkTd +
                '</tr>';
        })
        this.element.find("tbody").append(html);

        this.loadingComplete();
        // @ts-ignore
        $('#fleetEventsTable').DataTable({
            scrollY: "400px",
            scrollCollapse: true,
            paging:         false,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            order: [[ 0, "desc" ]]
        });
    }

    setupEventListeners()
    {
        super.setupEventListeners();
        this._emitter.on(Events.GET_FLEET_EVENTS_RESPONSE, this.onGetFleetEventsResponse);
    }

    removeEventListeners()
    {
        super.removeEventListeners();
        this._emitter.off(Events.GET_FLEET_EVENTS_RESPONSE, this.onGetFleetEventsResponse);
    }
}