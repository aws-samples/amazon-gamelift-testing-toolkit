// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Cdklabs.CdkNag;

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
            SecurityStack = new SecurityStack(this, "SecurityStack", new SecurityProps() { });
            DataStack = new DataStack(this, "DataStack", new DataProps() {});
            BackendStack = new BackendStack(this, "BackendStack", new BackendProps()
            {
                ManagementConfigTable = DataStack.ManagementConfigTable,
                ManagementConnectionsTable = DataStack.ManagementConnectionsTable,
                EventLogTable = DataStack.EventLogTable,
                GameSessionTable = DataStack.GameSessionTable,
                StateLogTable  = DataStack.StateLogTable,
                TicketLogTable  = DataStack.TicketLogTable,
                PlayerProfileTable  = DataStack.PlayerProfileTable,
                MatchmakingSimulationTable  = DataStack.MatchmakingSimulationTable,
                SimulationResultsTable  = DataStack.SimulationResultsTable,
                EncryptionKey = SecurityStack.EncryptionKey,
            });
            WebStack = new WebStack(this, "WebStack", new WebProps()
            {
                ApiProdStage = BackendStack.ProdStage,
            });
        }
    }
}