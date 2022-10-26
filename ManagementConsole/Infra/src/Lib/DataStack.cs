// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using Amazon.CDK;
using Amazon.CDK.AWS.DynamoDB;
using Constructs;

namespace ManagementConsoleInfra.Lib
{
    public class DataProps : StackProps
    {
        
    }
    public class DataStack : Stack
    {
        public Table ManagementConnectionsTable;
        public Table ManagementConfigTable;
        public Table EventLogTable;
        public Table GameSessionTable;
        public Table TicketLogTable;
        public Table StateLogTable;
        public Table MatchmakingSimulationTable;
        public Table SimulationResultsTable;
        public Table SimulationPlayersTable;
        public Table PlayerProfileTable;
        public Table LatencyProfileTable;
        
        internal DataStack(Construct scope, string id, DataProps props = null) : base(scope, id, props)
        {
            ManagementConnectionsTable = new Table(this, "ManagementConnectionsTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "ConnectionId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });

            TicketLogTable = new Table(this, "TicketLogTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "TicketId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });
            
            TicketLogTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "TicketDateTime-GSI",
                PartitionKey = new Attribute
                {
                    Name = "date",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "time-id",
                    Type = AttributeType.STRING
                }
            });
            
            TicketLogTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "MatchId-GSI",
                PartitionKey = new Attribute
                {
                    Name = "matchId",
                    Type = AttributeType.STRING
                }
            });
            
            TicketLogTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "CustomEventDataTime-GSI",
                PartitionKey = new Attribute
                {
                    Name = "customEventData",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "time",
                    Type = AttributeType.STRING
                }
            });
            
            TicketLogTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "TicketConfigTime-GSI",
                PartitionKey = new Attribute
                {
                    Name = "matchmakingConfigArn",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "time",
                    Type = AttributeType.STRING
                }
            });
            
            MatchmakingSimulationTable = new Table(this, "MatchmakingSimulationTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "SimulationId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });
            
            PlayerProfileTable = new Table(this, "PlayerProfileTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "ProfileId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });
            
            LatencyProfileTable = new Table(this, "LatencyProfileTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "ProfileId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                PointInTimeRecovery = true,
            });

            EventLogTable = new Table(this, "EventLogTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "id",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });

            EventLogTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "EventDateTime-GSI",
                PartitionKey = new Attribute
                {
                    Name = "date",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "time",
                    Type = AttributeType.STRING
                }
            });
            
            EventLogTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "PlacementId-GSI",
                PartitionKey = new Attribute
                {
                    Name = "placementId",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "time-id",
                    Type = AttributeType.STRING
                }
            });

            GameSessionTable = new Table(this, "GameSessionTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "GameSessionId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });
            
            GameSessionTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "Fleet-Date",
                PartitionKey = new Attribute
                {
                    Name = "FleetId",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "CreationTime",
                    Type = AttributeType.STRING
                }
            });
            
            GameSessionTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = "Fleet-StatusValue",
                PartitionKey = new Attribute
                {
                    Name = "FleetId",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "StatusValue",
                    Type = AttributeType.STRING
                }
            });

            StateLogTable = new Table(this, "StateLogTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "Date",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "Time",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                TimeToLiveAttribute = "TimeToLive",
                PointInTimeRecovery = true,
            });

            ManagementConfigTable = new Table(this, "ManagementConfigTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "ConfigId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                PointInTimeRecovery = true,
            });

            SimulationResultsTable = new Table(this, "SimulationResultsTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "SimulationId",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "MatchId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                PointInTimeRecovery = true,
            });
            
            SimulationPlayersTable = new Table(this, "SimulationPlayersTable", new TableProps
            {
                PartitionKey = new Attribute
                {
                    Name = "SimulationId",
                    Type = AttributeType.STRING
                },
                SortKey = new Attribute
                {
                    Name = "PlayerId",
                    Type = AttributeType.STRING
                },
                BillingMode = BillingMode.PAY_PER_REQUEST,
                Encryption = TableEncryption.AWS_MANAGED,
                RemovalPolicy = RemovalPolicy.DESTROY,
                PointInTimeRecovery = true,
            });

            new CfnOutput(this, "ticketLogTableName",  new CfnOutputProps {
                Value = TicketLogTable.TableName
            });
            
            new CfnOutput(this, "ticketLogTableArn",  new CfnOutputProps {
                Value = TicketLogTable.TableArn
            });
            
            new CfnOutput(this, "matchmakingSimulationTableName",  new CfnOutputProps {
                Value = MatchmakingSimulationTable.TableName
            });
            
            new CfnOutput(this, "simulationPlayersTableArn",  new CfnOutputProps {
                Value = SimulationPlayersTable.TableArn
            });
            
            new CfnOutput(this, "simulationPlayersTableName",  new CfnOutputProps {
                Value = SimulationPlayersTable.TableName
            });
            
            new CfnOutput(this, "matchmakingSimulationTableArn",  new CfnOutputProps {
                Value = MatchmakingSimulationTable.TableArn
            });
            
            new CfnOutput(this, "playerProfileTableName",  new CfnOutputProps {
                Value = PlayerProfileTable.TableName
            });
            
            new CfnOutput(this, "playerProfileTableArn",  new CfnOutputProps {
                Value = PlayerProfileTable.TableArn
            });
            
            new CfnOutput(this, "latencyProfileTableName",  new CfnOutputProps {
                Value = LatencyProfileTable.TableName
            });
            
            new CfnOutput(this, "latencyProfileTableArn",  new CfnOutputProps {
                Value = LatencyProfileTable.TableArn
            });
            
            new CfnOutput(this, "eventLogTableName",  new CfnOutputProps {
                Value = EventLogTable.TableName
            });
            
            new CfnOutput(this, "eventLogTableArn",  new CfnOutputProps {
                Value = EventLogTable.TableArn
            });
            
            new CfnOutput(this, "managementConnectionsTableName",  new CfnOutputProps {
                Value = ManagementConnectionsTable.TableName
            });
            
            new CfnOutput(this, "managementConnectionsTableArn",  new CfnOutputProps {
                Value = ManagementConnectionsTable.TableArn
            });

            new CfnOutput(this, "stateLogTableName",  new CfnOutputProps {
                Value = StateLogTable.TableName
            });

            new CfnOutput(this, "stateLogTableArn",  new CfnOutputProps {
                Value = StateLogTable.TableArn
            });
            
            new CfnOutput(this, "gameSessionTableName",  new CfnOutputProps {
                Value = GameSessionTable.TableName
            });
            
            new CfnOutput(this, "gameSessionTableArn",  new CfnOutputProps {
                Value = GameSessionTable.TableArn
            });
            
            new CfnOutput(this, "managementConfigTableName",  new CfnOutputProps {
                Value = ManagementConfigTable.TableName
            });
            new CfnOutput(this, "managementConfigTableArn",  new CfnOutputProps {
                Value = ManagementConfigTable.TableArn
            });

            new CfnOutput(this, "simulationResultsTableName",  new CfnOutputProps {
                Value = SimulationResultsTable.TableName
            });
            
            new CfnOutput(this, "simulationResultsTableArn",  new CfnOutputProps {
                Value = SimulationResultsTable.TableArn
            });
        }
    }
}
