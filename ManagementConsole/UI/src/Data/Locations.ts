// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface Location {
    regionCode: string;
    regionTitle: string;
}

export class Locations
{
    public static Locations: Location[] =
        [
            { regionCode: "us-east-1", regionTitle: "US East (N. Virginia)"},
            { regionCode: "us-east-2", regionTitle: "US East (Ohio)" },
            { regionCode: "us-west-1", regionTitle: "US West (N. California)" },
            { regionCode: "us-west-2", regionTitle: "US West (Oregon)" },
            { regionCode: "af-south-1", regionTitle: "Africa (Cape Town)" },
            { regionCode: "ap-south-1", regionTitle: "Asia Pacific (Mumbai)" },
            { regionCode: "ap-east-1", regionTitle: "Asia Pacific (Hong Kong)" },
            { regionCode: "ap-northeast-1", regionTitle: "Asia Pacific (Tokyo)" },
            { regionCode: "ap-northeast-2", regionTitle: "Asia Pacific (Seoul)" },
            { regionCode: "ap-northeast-3", regionTitle: "Asia Pacific (Osaka)" },
            { regionCode: "ap-southeast-1", regionTitle: "Asia Pacific (Singapore)" },
            { regionCode: "ap-southeast-2", regionTitle: "Asia Pacific (Sydney)" },
            { regionCode: "ca-central-1", regionTitle: "Canada (Central)" },
            { regionCode: "eu-west-1", regionTitle: "Europe (Ireland)" },
            { regionCode: "eu-west-2", regionTitle: "Europe (London)" },
            { regionCode: "eu-west-3", regionTitle: "Europe (Paris)" },
            { regionCode: "eu-south-1", regionTitle: "Europe (Milan)" },
            { regionCode: "eu-north-1", regionTitle: "Europe (Stockholm)" },
            { regionCode: "eu-central-1", regionTitle: "Europe (Frankfurt)" },
            { regionCode: "me-south-1", regionTitle: "Middle East (Bahrain)" },
            { regionCode: "sa-east-1", regionTitle: "South America (São Paulo)" },
        ];

    public static HomeLocations: Location[] =
        [
                { regionCode: "us-east-1", regionTitle: "US East (N. Virginia)"},
                { regionCode: "us-east-2", regionTitle: "US East (Ohio)" },
                { regionCode: "us-west-1", regionTitle: "US West (N. California)" },
                { regionCode: "us-west-2", regionTitle: "US West (Oregon)" },
                { regionCode: "ap-south-1", regionTitle: "Asia Pacific (Mumbai)" },
                { regionCode: "ap-northeast-1", regionTitle: "Asia Pacific (Tokyo)" },
                { regionCode: "ap-northeast-2", regionTitle: "Asia Pacific (Seoul)" },
                { regionCode: "ap-southeast-1", regionTitle: "Asia Pacific (Singapore)" },
                { regionCode: "ap-southeast-2", regionTitle: "Asia Pacific (Sydney)" },
                { regionCode: "ca-central-1", regionTitle: "Canada (Central)" },
                { regionCode: "eu-west-1", regionTitle: "Europe (Ireland)" },
                { regionCode: "eu-west-2", regionTitle: "Europe (London)" },
                { regionCode: "eu-central-1", regionTitle: "Europe (Frankfurt)" },
                { regionCode: "sa-east-1", regionTitle: "South America (São Paulo)" },
        ];


}