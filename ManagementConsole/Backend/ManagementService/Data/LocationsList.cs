// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System.Collections.Generic;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class LocationsList
    {
        public static List<Amazon.RegionEndpoint> GameLiftLocations = new List<Amazon.RegionEndpoint>()
        {
            Amazon.RegionEndpoint.USEast1,
            Amazon.RegionEndpoint.USEast2,
            Amazon.RegionEndpoint.USWest1,
            Amazon.RegionEndpoint.USWest2,
            Amazon.RegionEndpoint.AFSouth1,
            Amazon.RegionEndpoint.APSouth1,
            Amazon.RegionEndpoint.APEast1,
            Amazon.RegionEndpoint.APNortheast1,
            Amazon.RegionEndpoint.APNortheast2,
            Amazon.RegionEndpoint.APNortheast3,
            Amazon.RegionEndpoint.APSoutheast1,
            Amazon.RegionEndpoint.APSoutheast2,
            Amazon.RegionEndpoint.CACentral1,
            Amazon.RegionEndpoint.EUWest1,
            Amazon.RegionEndpoint.EUWest2,
            Amazon.RegionEndpoint.EUWest3,
            Amazon.RegionEndpoint.EUSouth1,
            Amazon.RegionEndpoint.EUNorth1,
            Amazon.RegionEndpoint.EUCentral1,
            Amazon.RegionEndpoint.MESouth1,
            Amazon.RegionEndpoint.SAEast1,
        };
        
        public static List<Amazon.RegionEndpoint> GameLiftHomeLocations = new List<Amazon.RegionEndpoint>()
        {
            Amazon.RegionEndpoint.USEast1,
            Amazon.RegionEndpoint.USEast2,
            Amazon.RegionEndpoint.USWest1,
            Amazon.RegionEndpoint.USWest2,
            Amazon.RegionEndpoint.APSouth1,
            Amazon.RegionEndpoint.APNortheast1,
            Amazon.RegionEndpoint.APNortheast2,
            Amazon.RegionEndpoint.APSoutheast1,
            Amazon.RegionEndpoint.APSoutheast2,
            Amazon.RegionEndpoint.CACentral1,
            Amazon.RegionEndpoint.EUWest1,
            Amazon.RegionEndpoint.EUWest2,
            Amazon.RegionEndpoint.EUCentral1,
            Amazon.RegionEndpoint.SAEast1,
        };
    }
}
