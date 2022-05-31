// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using Aws.GameLift;
using Aws.GameLift.Server.Model;

namespace SampleGameBuild.GameLiftIntegration.Server
{
    public interface IGameLiftServer
    {
        int Port
        {
            get;
        }
        
        string LogFilePath
        {
            get;
        }

        public void OnGameLiftSDKActivationSuccess(GenericOutcome outcome);
        public void OnGameLiftSDKActivationFailure(GenericOutcome outcome);
        public void OnGameLiftSDKActivationException(Exception e);

        public void OnGameLiftMetadataLoaded(GameLiftMetadata metadata);
        public void OnGameLiftGameSessionRequested(GameSession gameSession);
        public void OnGameLiftGameSessionActivationSuccess(GameSession gameSession, GenericOutcome outcome);
        public void OnGameLiftGameSessionActivationFailure(GameSession gameSession, GenericOutcome outcome);
        public void OnGameLiftGameSessionActivationException(Exception e);
        
        public void OnGameLiftProcessReadySuccess(GenericOutcome outcome);
        public void OnGameLiftProcessReadyFailure(GenericOutcome outcome);
        public void OnGameLiftProcessReadyException(Exception e);
        public void OnGameLiftProcessTerminate();
        
        public void OnGameLiftProcessEndingSuccess(GenericOutcome outcome);
        public void OnGameLiftProcessEndingFailure(GenericOutcome outcome);
        public void OnGameLiftProcessEndingException(Exception e);

        public bool OnGameLiftHealthCheck();
    }
}