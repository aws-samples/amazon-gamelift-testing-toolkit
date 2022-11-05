// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export namespace DataTypes
{
    export interface SimpleResult
    {
        Errors: string[];
    }

    export interface MultipartMessage
    {
        Type:       string;
        MessageId:  string;
        TotalParts: number;
        PartNumber: number;
        Payload:    string;
    }

    export interface StateMessage {
        State : State,
        FlexMatchEventDetail: FlexMatchEventDetail,
        QueuePlacementEventDetail: QueuePlacementEventDetail,
        Resources: string[],
        Type : string
    }

    export interface MatchmakingRuleSet {
        CreationTime:       Date;
        RuleSetArn:         string;
        RuleSetBody:         string;
        RuleSetName:         string;

    }

    export interface QueuePlacementEventDetail {
        type:                 string;
        placementId:          string;
        port:                 string;
        gameSessionArn:       string;
        ipAddress:            string;
        dnsName:              string;
        gameSessionRegion:    string;
        startTime:            Date;
        endTime:              Date;
        placedPlayerSessions: PlacedPlayerSession[];
    }

    export interface PlacedPlayerSession {
        playerId:        string;
        playerSessionId: string;
    }

    export interface FlexMatchEventDetail {
        tickets:         Ticket[];
        type:            string;
        gameSessionInfo: GameSessionInfo;
        matchId:         string;
    }

    export interface GameSessionInfo {
        players:        Player[];
        gameSessionArn: string;
        ipAddress:      string;
        port:           number;
    }

    export interface Player {
        playerId:         string;
        team:             string;
        playerSessionId?: string;
    }

    export enum Team {
        MyTeam = "MyTeam",
    }

    export interface Ticket {
        ticketId:  string;
        startTime: Date;
        players:   Player[];
    }

    export interface Fleet extends FleetAttributes
    {
        GameSessions: GameSession[];
        FleetCapacity: FleetCapacity;
        Instances: Instance[];
        FleetUtilization: FleetUtilization;
    }

    export interface FleetData {
        FleetId:                string;
        FleetCapacity:          FleetCapacity;
        FleetUtilization:       FleetUtilization;
        FleetAttributes:        FleetAttributes;
        LocationAttributes:     LocationAttributes[];
        LocationCapacities:     FleetCapacity[];
        ScalingPolicies:        ScalingPolicy[];
        RuntimeConfiguration:   RuntimeConfiguration;
        FleetEvents:            FleetEvent[];
        GameSessions:           GameSession[];
        Instances:              Instance[];
        Metrics:                {};
    }

    export interface ScalingPolicy {
        ComparisonOperator:     string;
        EvaluationPeriods:      number;
        FleetArn:               string;
        FleetId:                string;
        Location:               string;
        MetricName:             string;
        Name:                   string;
        PolicyType:             string;
        ScalingAdjustment:      number;
        ScalingAdjustmentType:  string;
        Status:                 ValueObject;
        TargetConfiguration:    TargetConfiguration;
        Threshold:              number;
        UpdateStatus:           string;
    }

    export interface TargetConfiguration {
        TargetValue:            number;
    }

    export interface LocationAttributes {
        LocationState:      LocationState;
        StoppedActions:     string[];
        UpdateStatus:       string;
    }

    export interface LocationState {
        Location:           string;
        Status:             ValueObject;
    }

    export interface State {
        FleetData:        FleetData[];
        /*
        GameSessions:     GameSession[];
        FleetCapacities:  FleetCapacity[];
        FleetUtilization: FleetUtilization[];
        FleetAttributes: FleetAttributes[];
        FleetEvents:      FleetEvent[];
        Instances:        Instance[];
        PlayerSessions:   PlayerSession[];*/
        MatchmakingConfigurations: MatchmakingConfiguration[];
        MatchmakingSimulator: MatchmakingConfiguration;
        GameSessionQueues: GameSessionQueue[];
        Aliases: Alias[];
    }

    export interface FleetCapacity {
        FleetArn:       string;
        FleetId:        string;
        InstanceCounts: InstanceCounts;
        InstanceType:   ValueObject;
        Location:       string;
    }

    export interface FleetAttributes {
        BuildArn:                       string;
        BuildId:                        string;
        CertificateConfiguration:       CertificateConfiguration;
        CreationTime:                   Date;
        Description:                    null;
        FleetArn:                       string;
        FleetId:                        string;
        FleetType:                      ValueObject;
        InstanceRoleArn:                string;
        InstanceType:                   ValueObject;
        LogPaths:                       any[];
        MetricGroups:                   string[];
        Name:                           string;
        NewGameSessionProtectionPolicy: ValueObject;
        OperatingSystem:                ValueObject;
        ResourceCreationLimitPolicy:    null;
        ScriptArn:                      null;
        ScriptId:                       null;
        ServerLaunchParameters:         null;
        ServerLaunchPath:               string;
        Status:                         ValueObject;
        StoppedActions:                 any[];
        TerminationTime:                Date;
    }

    export interface RuntimeConfiguration {
        GameSessionActivationTimeoutSeconds:    number;
        MaxConcurrentGameSessionActivations:    number;
        ServerProcesses:                        ServerProcess[];
    }

    export interface ServerProcess {
        ConcurrentExecutions:                   number;
        LaunchPath:                             string;
        Parameters:                             string;
    }

    export interface CertificateConfiguration {
        CertificateType: ValueObject;
    }

    export interface InstanceCounts {
        ACTIVE:      number;
        DESIRED:     number;
        IDLE:        number;
        MAXIMUM:     number;
        MINIMUM:     number;
        PENDING:     number;
        TERMINATING: number;
    }

    export interface ValueObject {
        Value: string;
    }

    export interface FleetEvent {
        EventCode:       ValueObject;
        EventId:         string;
        EventTime:       Date;
        Message:         string;
        PreSignedLogUrl: null | string;
        ResourceId:      string;
    }

    export interface FleetUtilization {
        ActiveGameSessionCount:    number;
        ActiveServerProcessCount:  number;
        CurrentPlayerSessionCount: number;
        FleetArn:                  string;
        FleetId:                   string;
        Location:                  string;
        MaximumPlayerSessionCount: number;
    }

    export interface GameSession {
        CreationTime:                Date;
        CreatorId:                   null;
        CurrentPlayerSessionCount:   number;
        DnsName:                     string;
        FleetArn:                    string;
        FleetId:                     string;
        GameProperties:              GameProperty[];
        GameSessionData:             string;
        GameSessionId:               string;
        IpAddress:                   string;
        Location:                    string;
        MatchmakerData:              string;
        MaximumPlayerSessionCount:   number;
        Name:                        string;
        PlayerSessionCreationPolicy: ValueObject;
        Port:                        number;
        Status:                      ValueObject;
        StatusReason:                null;
        TerminationTime:             Date;
        PlayerSessions?:             PlayerSession[];
    }

    export interface GameProperty {
        Key:   string;
        Value: string;
    }

    export interface Instance {
        CreationTime:    Date;
        DnsName:         string;
        FleetArn:        string;
        FleetId:         string;
        InstanceId:      string;
        IpAddress:       string;
        Location:        string;
        OperatingSystem: ValueObject;
        Status:          ValueObject;
        Type:            ValueObject;
    }

    export interface PlayerSession {
        CreationTime:    Date;
        DnsName:         string;
        FleetArn:        string;
        FleetId:         string;
        GameSessionId:   string;
        IpAddress:       string;
        PlayerData:      null;
        PlayerId:        string;
        PlayerSessionId: string;
        Port:            number;
        Status:          ValueObject;
        TerminationTime: Date;
    }

    export interface MatchmakingConfiguration {
        AcceptanceRequired:       boolean;
        AcceptanceTimeoutSeconds: number;
        AdditionalPlayerCount:    number;
        BackfillMode:             ValueObject;
        ConfigurationArn:         string;
        CreationTime:             Date;
        CustomEventData:          null;
        Description:              string;
        FlexMatchMode:            ValueObject;
        GameProperties:           GameProperty[];
        GameSessionData:          string;
        GameSessionQueueArns:     string[];
        Name:                     string;
        NotificationTarget:       null;
        RequestTimeoutSeconds:    number;
        RuleSetArn:               string;
        RuleSetName:              string;
    }

    export interface GameSessionQueue {
        CustomEventData:       null;
        Destinations:          Destination[];
        FilterConfiguration:   null;
        GameSessionQueueArn:   string;
        Name:                  string;
        NotificationTarget:    null;
        PlayerLatencyPolicies: any[];
        PriorityConfiguration: null;
        TimeoutInSeconds:      number;
    }

    export interface Destination {
        DestinationArn: string;
    }

    export interface Alias {
        AliasArn:        string;
        AliasId:         string;
        CreationTime:    Date;
        Description:     string;
        LastUpdatedTime: Date;
        Name:            string;
        RoutingStrategy: RoutingStrategy;
    }

    export interface RoutingStrategy {
        FleetId: string;
        Message: string;
        Type:    ValueObject;
    }

    export interface PlayerProfile {
        ProfileId?: string;
        Name: string;
        Team?: string;
        Attributes: PlayerProfileAttribute[];
    }

    export interface PlayerProfileAttribute {
        AttributeName: string;
        AttributeType: string;
        ValueType: string;
        Min?: number;
        Max?: number;
        Value: string | number | string[];
        ValueMap: Record<string, number>;
    }

    export interface LatencyProfile {
        ProfileId?: string;
        Name: string;
        LatencyData: RegionLatency[];
    }

    export interface RegionLatency {
        Region: string;
        MinLatency: number;
        MaxLatency: number;
    }

}

