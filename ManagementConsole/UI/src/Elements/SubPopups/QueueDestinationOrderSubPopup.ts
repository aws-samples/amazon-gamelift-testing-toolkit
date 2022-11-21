// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {SubPopup} from "../Abstract/SubPopup";
import GameSessionQueue = DataTypes.GameSessionQueue;
import {Locations} from "../../Data/Locations";
import Alias = DataTypes.Alias;
import FleetAttributes = DataTypes.FleetAttributes;
var parser = require('aws-arn-parser');

export class QueueDestinationOrderSubPopup extends SubPopup
{
    protected _queue:GameSessionQueue;
    protected _queueAliases:Alias[];
    protected _queueFleets:FleetAttributes[];
    protected _otherAliases:Alias[];
    protected _otherFleets:FleetAttributes[];
    protected _destinationsDataTable: any;
    protected _types: any = ["Alias", "Fleet"];

    public constructor (cacheKey:string, parentDomId:string, gameSessionQueue:GameSessionQueue)
    {
        super(cacheKey, parentDomId);
        this._queue = gameSessionQueue;
    }

    refresh = ()=>
    {
        this.hideStatusAlert();
        Network.sendObject({Type:"GetGameSessionQueueDestinationInfo", QueueArn:this._queue.GameSessionQueueArn});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_GAME_SESSION_QUEUE_DESTINATION_INFO, this.onGetGameSessionQueueDestinationInfoResponse);
        this._emitter.on(Events.GET_ALIASES, this.onGetAliases);
        this._emitter.on(Events.GET_FLEET_ATTRIBUTES, this.onGetFleetAttributes);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_GAME_SESSION_QUEUE_DESTINATION_INFO, this.onGetGameSessionQueueDestinationInfoResponse);
        this._emitter.off(Events.GET_ALIASES, this.onGetAliases);
        this._emitter.off(Events.GET_FLEET_ATTRIBUTES, this.onGetFleetAttributes);
    }

    onGetGameSessionQueueDestinationInfoResponse = (data) =>
    {
        this._queue = data.GameSessionQueue as GameSessionQueue;
        this._queueAliases = data.Aliases as Alias[];
        this._queueFleets = data.FleetAttributes as FleetAttributes[];
        this.updateForm();
    }

    onGetFleetAttributes = (data) =>
    {
        const region = $('select.destinationOrder-location').val();
        if (data.FleetAttributes.length==0)
        {
            $('select.destinationOrder-name').html('<option type="text" value="">No fleets found in ' + region + '</option>');
            $('select.destinationOrder-name').prop('disabled', true);
        }
        else
        {
            this._otherFleets = data.FleetAttributes;

            $('select.destinationOrder-name').html('<option type="text" value="">Choose a fleet</option>');
            data.FleetAttributes.map(fleetAttributes=>
            {
                $('select.destinationOrder-name').append('<option value="' + fleetAttributes.FleetArn + '">' + fleetAttributes.Name + '</option>');
            });
            $('select.destinationOrder-name').prop('disabled', false);
        }

    }

    onGetAliases = (data) =>
    {
        const region = $('select.destinationOrder-location').val();
        if (data.Aliases.length==0)
        {
            $('select.destinationOrder-name').html('<option type="text" value="">No aliases found in ' + region + '</option>');
            $('select.destinationOrder-name').prop('disabled', true);
        }
        else
        {
            this._otherAliases = data.Aliases;

            $('select.destinationOrder-name').html('<option type="text" value="">Choose an alias</option>');
            data.Aliases.map(alias=>
            {
                $('select.destinationOrder-name').append('<option value="' + alias.AliasArn + '">' + alias.Name + '</option>');
            });
            $('select.destinationOrder-name').prop('disabled', false);
        }
    }


    parseDestinationArn = (destinationArn) =>
    {
        let arn = parser(destinationArn);
        let parts = destinationArn.split("/");
        var resourceId = parts.pop();
        if (arn.relativeId.indexOf("alias")==0)
        {
            let result = this._queueAliases.filter(alias => alias.AliasId == resourceId);
            if (result.length==0)
            {
                result = this._otherAliases.filter(alias => alias.AliasId == resourceId);
            }
            return {
                DestinationArn: destinationArn,
                Name: result[0].Name,
                Type: "Alias",
                Region: arn.region,
            }
        }
        else
        if (arn.relativeId.indexOf("fleet")==0)
        {
            let result = this._queueFleets.filter(fleet => fleet.FleetId == resourceId);
            if (result.length==0)
            {
                result = this._otherFleets.filter(fleet => fleet.FleetId == resourceId);
            }
            return {
                DestinationArn: destinationArn,
                Name: result[0].Name,
                Type: "Fleet",
                Region: arn.region,
            };
        }
    }

    updateForm = () =>
    {
        this.resetElement(".queueDestinationOrderContent");
        let destinationOrder = this._queue.Destinations;
        let destinations = [];
        destinationOrder.map(destination=>
        {
            destinations.push(this.parseDestinationArn(destination.DestinationArn));
        });

        let destinationOrderNo=1;
        destinations.map (destination=>
        {
            $('#queueDestinationOrderTable tbody').append('<tr><td>' + destinationOrderNo + '</td><td>' + destination.Region + '</td><td>' + destination.Name + '</td><td>' + destination.Type + '</td><td>' + destination.DestinationArn + '</td><td>' + this.getRemoveButton(destination.DestinationArn) + '</td></tr>');
            destinationOrderNo++;
        });

        this._destinationsDataTable = this.activateDataTable("queueDestinationOrderTable", {
            dom: "t",
            columnDefs: [
                { width: 100, targets: 0 },
                { orderable:false, targets: 'no-sort'},
                { target:4, visible:false}
            ],
            rowReorder: {
                dataSrc: 0
            },
        });

        this.updateLocations();
        $('select.destinationOrder-location').on("change", this.onChange);
        $('select.destinationOrder-type').on("change", this.onChange);
        $('select.destinationOrder-name').on("change", this.onChangeResource);
    }

    onChangeResource = (e) =>
    {
        const resourceArn = $('select.destinationOrder-name').val();
        if (resourceArn=="")
        {
            $('button.addDestination').prop('disabled', 'disabled');
        }
        else
        {
            $('button.addDestination').prop('disabled', false);
        }
    }

    onChange = (e) =>
    {
        $('select.destinationOrder-name').html("");
        $('select.destinationOrder-name').prop('disabled', 'disabled');
        $('button.addDestination').prop('disabled', 'disabled');
        const region = $('select.destinationOrder-location').val();
        const destinationType = $('select.destinationOrder-type').val();
        if (region!="" && destinationType!="")
        {
            if (destinationType=="Alias")
            {
                Network.sendObject({Type:"GetAliases", QueueArn:this._queue.GameSessionQueueArn, Region:region});
            }
            else
            {
                Network.sendObject({Type:"GetFleetAttributes", QueueArn:this._queue.GameSessionQueueArn, Region:region});
            }
        }
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

        if (el.hasClass("updateQueueDestinations"))
        {
            let arn = parser(this._queue.GameSessionQueueArn);

            let destinations=[];
            this._destinationsDataTable.data().toArray().map((row)=>
            {
                destinations[parseInt(row[0])-1]=row[4];
            });

            Network.sendObject({Type: "UpdateQueueDestinations", QueueArn: this._queue.GameSessionQueueArn, Destinations:destinations});
        }

        if (el.hasClass("removeDestination"))
        {
            this._destinationsDataTable.row($(el).parents("tr")).remove().draw();
            this.updateTableOrderValues(this._destinationsDataTable);
        }

        if (el.hasClass("addDestination"))
        {
            let addedDestination = this.parseDestinationArn($(('select.destinationOrder-name')).val() as string);
            let newRow = [(
                this._destinationsDataTable.data().toArray().length+1),
                addedDestination.Region,
                addedDestination.Name,
                addedDestination.Type,
                addedDestination.DestinationArn,
                this.getRemoveButton(addedDestination.DestinationArn)
            ];
            this._destinationsDataTable.row.add(newRow).draw();
            this.updateTableOrderValues(this._destinationsDataTable);
        }
    }

    updateLocations()
    {
        $('select.destinationOrder-location').html('<option type="text" value="">Choose a Region</option>');
        Locations.HomeLocations.map((destination)=>
        {
            $('select.destinationOrder-location').append('<option type="text" value="' + destination.regionCode + '">' + destination.regionCode + '</option>');
        });
    }

    getRemoveButton(destination:string)
    {
        return '<a id="' + destination + '" class="removeDestination btn btn-primary btn-sm">Remove</a>';
    }
}