// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Popup} from "../Abstract/Popup";
import FleetData = DataTypes.FleetData;

export class FleetEventsPopup extends Popup
{
    protected _fleetData:FleetData;
    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="fleetEventsPopup";
    }

    setPopupData(data:any)
    {
        this._fleetData = data.gameObject.Data as FleetData;

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
    }

    drawComplete() {
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
}