// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Cdklabs.CdkNag;
using Constructs;

namespace ManagementConsoleInfra.Lib
{
    public class InfraStageProps : StageProps
    {
        
    }
    public class InfraStage : Stage
    {
        public SecurityStack SecurityStack;
        public DataStack DataStack;
        public WebStack WebStack;
        public BackendStack BackendStack;
        
        internal InfraStage(Construct scope, string id, InfraStageProps props = null) : base(scope, id, props)
        {
            SecurityStack = new SecurityStack(this, "SecurityStack", new SecurityProps
            {
                Description = "GameLift Testing Toolkit - Security infrastructure"
            });
            DataStack = new DataStack(this, "DataStack", new DataProps
            {
                Description = "GameLift Testing Toolkit - Database infrastructure"
            });
            BackendStack = new BackendStack(this, "BackendStack", new BackendProps
            {
                ManagementConfigTable = DataStack.ManagementConfigTable,
                ManagementConnectionsTable = DataStack.ManagementConnectionsTable,
                EventLogTable = DataStack.EventLogTable,
                GameSessionTable = DataStack.GameSessionTable,
                StateLogTable  = DataStack.StateLogTable,
                TicketLogTable  = DataStack.TicketLogTable,
                MatchLogTable  = DataStack.MatchLogTable,
                PlayerProfileTable  = DataStack.PlayerProfileTable,
                LatencyProfileTable  = DataStack.LatencyProfileTable,
                MatchmakingSimulationTable  = DataStack.MatchmakingSimulationTable,
                SimulationResultsTable  = DataStack.SimulationResultsTable,
                SimulationPlayersTable  = DataStack.SimulationPlayersTable,
                EncryptionKey = SecurityStack.EncryptionKey,
                Description = "(SO9068) GameLift Testing Toolkit - Backend infrastructure"
            });
            WebStack = new WebStack(this, "WebStack", new WebProps
            {
                ApiProdStage = BackendStack.ProdStage,
                Description = "GameLift Testing Toolkit - Web console infrastructure"
            });
        }
    }
}