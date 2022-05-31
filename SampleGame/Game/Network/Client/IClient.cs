// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

namespace SampleGameBuild.Network.Client
{
    public interface IClient
    {
        bool Running { get; }
        void OnLoop();
        bool IsActive();
    }
}