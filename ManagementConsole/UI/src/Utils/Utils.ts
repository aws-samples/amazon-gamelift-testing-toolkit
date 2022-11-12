// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class Utils
{
    public static secondsToDuration = function (durationSeconds:number):string
    {
        const hours   = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds - (hours * 3600)) / 60);
        const seconds = durationSeconds - (hours * 3600) - (minutes * 60);

        let result="";
        if (hours > 0)
        {
            result += hours + " hours, ";
        }
        if (minutes > 0) {
            result += minutes + " mins, ";
        }

        result += seconds + " seconds";
        return result;
    }


    public static getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    public static getPlayerAttributeText(playerAttribute)
    {
        if (playerAttribute==undefined)
        {
            return "-";
        }
        if (playerAttribute["S"]!=null)
        {
            return playerAttribute["S"];
        }

        if (playerAttribute["SL"].length>0)
        {
            return playerAttribute["SL"].join(", ");
        }

        if (Object.keys(playerAttribute["SDM"]).length)
        {
            let mapText="";
            Object.keys(playerAttribute["SDM"]).map(key=>
            {
                mapText+=key + ":" + playerAttribute["SDM"][key] + ", ";
            });

            mapText = mapText.slice(0,mapText.length-2);
            return mapText;
        }

        return playerAttribute["N"];

    }
}

