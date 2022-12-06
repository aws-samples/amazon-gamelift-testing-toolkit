// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {SubPopup} from "../Abstract/SubPopup";
import GameSessionQueue = DataTypes.GameSessionQueue;
import {Locations} from "../../Data/Locations";
import {SubPopups} from "./SubPopups";
var parser = require('aws-arn-parser');

export class QueuePlacementPrioritySubPopup extends SubPopup
{
    public static id = SubPopups.QUEUE_PLACEMENT_PRIORITY_SUB_POPUP;
    public static cacheKey = this.id;

    protected _queue:GameSessionQueue;
    protected _priorityDataTable: any;
    protected _locationOrderDataTable: any;
    protected _priorityNames: any = {
        LATENCY: "<b>Latency</b> - Prioritize locations with the lowest average player latency",
        COST: "<b>Cost</b> - Prioritize destinations with the lowest current hosting cost",
        DESTINATION: "<b>Destination</b> - Prioritize based on the defined destination order",
        LOCATION: "<b>Location</b> - Prioritize based on the defined location order",
    };

    protected _defaultPriority: string[] = [
        "LATENCY",
        "COST",
        "DESTINATION",
        "LOCATION"
    ];

    public constructor (gameSessionQueue:GameSessionQueue)
    {
        super(QueuePlacementPrioritySubPopup.cacheKey, QueuePlacementPrioritySubPopup.id);
        this._queue = gameSessionQueue;
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetGameSessionQueue", QueueArn:this._queue.GameSessionQueueArn});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_GAME_SESSION_QUEUE, this.onGetGameSessionQueueResponse);
        this._emitter.on(Events.UPDATE_GAME_SESSION_QUEUE_RESPONSE, this.onUpdateGameSessionQueueResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_GAME_SESSION_QUEUE, this.onGetGameSessionQueueResponse);
        this._emitter.off(Events.UPDATE_GAME_SESSION_QUEUE_RESPONSE, this.onUpdateGameSessionQueueResponse);
    }

    onGetGameSessionQueueResponse = (data) =>
    {
        this._queue = data.GameSessionQueue as GameSessionQueue;
        this.updateForm();
    }

    updateForm = () =>
    {
        this.resetElement(".queuePlacementPriorityContent");
        let arn = parser(this._queue.GameSessionQueueArn);
        let priorityOrder = this._defaultPriority;
        let locationOrder = [arn.region];
        if (this._queue.PriorityConfiguration!=null)
        {
            // @ts-ignore
            priorityOrder = this._queue.PriorityConfiguration.PriorityOrder;
            // @ts-ignore
            locationOrder = this._queue.PriorityConfiguration.LocationOrder;
        }

        let priorityOrderNo=1;
        priorityOrder.map (priority=>
        {
            $('#queuePriorityTable tbody').append('<tr><td>' + priorityOrderNo + '</td><td>' + this._priorityNames[priority] + '</td><td>' + priority + '</td></tr>');
            priorityOrderNo++;
        });

        let locationOrderNo=1;
        locationOrder.map (location=>
        {
            $('#queueLocationOrderTable tbody').append('<tr><td>' + locationOrderNo + '</td><td>' + location + '</td><td>' + this.getRemoveButton(location) + '</td></tr>');
            locationOrderNo++;
        });

        this._priorityDataTable = this.activateDataTable("queuePriorityTable", {
            dom: "t",
            columnDefs: [
                { width: 200, targets: 0 },
                { orderable:false, targets: 'no-sort'},
                { target:2, visible:false}
            ],
            rowReorder: {
                dataSrc: 0
            },
        });

        this._locationOrderDataTable = this.activateDataTable("queueLocationOrderTable", {
            dom: "t",
            columnDefs: [
                { width: 200, targets: 0 },
                { orderable:false, targets: 'no-sort'},
            ],
            rowReorder: {
                dataSrc: 0
            },
        });

        this.updateAvailableLocations();
    }

    onUpdateGameSessionQueueResponse = (data) =>
    {
        if (data.Updated)
        {
            this.showSuccessAlert("Queue updated successfully");
            this._queue = data.UpdatedQueue;
            this.updateForm();
        }
        else
        {
            this.showFailureAlert("Error: " + data.ErrorMessage);
        }
    }

    onPopupClick = async (event) => {
        event.stopPropagation();
        let el = $(event.target);

        if (el.hasClass("updateQueuePriority"))
        {
            let arn = parser(this._queue.GameSessionQueueArn);
            let priorityOrder=[];
            this._priorityDataTable.data().toArray().map((row)=>
            {
                priorityOrder[parseInt(row[0])-1]=row[2];
            });

            let locationOrder=[];
            this._locationOrderDataTable.data().toArray().map((row)=>
            {
                locationOrder[parseInt(row[0])-1]=row[1];
            });

            Network.sendObject({Type: "UpdateQueuePriorityConfiguration", QueueArn: this._queue.GameSessionQueueArn, PriorityOrder: priorityOrder, LocationOrder:locationOrder});
        }

        if (el.hasClass("removeLocation"))
        {
            this._locationOrderDataTable.row($(el).parents("tr")).remove().draw();
            this.updateTableOrderValues(this._locationOrderDataTable);
            this.updateAvailableLocations();
        }

        if (el.hasClass("addLocation"))
        {
            let addedLocation = $('select.locationOrder-location').val() as string;
            this._locationOrderDataTable.row.add([(this._locationOrderDataTable.data().toArray().length+1), addedLocation, this.getRemoveButton(addedLocation)]).draw();
            this.updateTableOrderValues(this._locationOrderDataTable);
            this.updateAvailableLocations();
        }
    }

    getAvailableLocations()
    {
        let availableLocations=[];
        let existingLocations=[];
        this._locationOrderDataTable.data().toArray().map(row=>
        {
            existingLocations.push(row[1]);
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
        $('select.locationOrder-location').html("");
        availableLocations.map((location)=>
        {
            $('select.locationOrder-location').append('<option type="text" value="' + location + '">' + location + '</option>');
        });
    }

    getRemoveButton(location:string)
    {
        return '<a id="' + location + '" class="removeLocation btn btn-primary btn-sm">Remove</a>';
    }
}