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
import Instance = DataTypes.Instance;
import GameSession = DataTypes.GameSession;
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
        this._popup.node.querySelector("tbody").insertAdjacentHTML("beforeend", html);

        /*
                this._popup.getChildByID("gameSessionId").innerHTML=gameSessionData.GameSessionId;
                this._popup.getChildByID("ipAddress").innerHTML=gameSessionData.IpAddress;
                this._popup.getChildByID("dnsName").innerHTML=gameSessionData.DnsName;
                this._popup.getChildByID("region").innerHTML=gameSessionData.Location;
                this._popup.getChildByID("currentPlayerSessions").innerHTML=gameSessionData.CurrentPlayerSessionCount + "/" + gameSessionData.MaximumPlayerSessionCount;
                this._popup.getChildByID("instanceStatus").innerHTML=gameSessionData.Status.Value;
                this._popup.getChildByID("creationDate").innerHTML=new Date(gameSessionData.CreationTime).toISOString();

         */
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