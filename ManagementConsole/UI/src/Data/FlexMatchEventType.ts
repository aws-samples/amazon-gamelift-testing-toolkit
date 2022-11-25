export class FlexMatchEventType
{
    public static MATCHMAKING_SEARCHING:string = "MatchmakingSearching";
    public static POTENTIAL_MATCH_CREATED:string = "PotentialMatchCreated";
    public static MATCHMAKING_SUCCEEDED:string = "MatchmakingSucceeded";
    public static MATCHMAKING_TIMED_OUT:string = "MatchmakingTimedOut";
    public static MATCHMAKING_CANCELLED:string = "MatchmakingCancelled";
    public static MATCHMAKING_FAILED:string = "MatchmakingFailed";
    public static ACCEPT_MATCH:string = "AcceptMatch";
    public static ACCEPT_MATCH_COMPLETED:string = "AcceptMatchCompleted";

    public static failureEvents:string[] = [FlexMatchEventType.MATCHMAKING_CANCELLED, FlexMatchEventType.MATCHMAKING_FAILED, FlexMatchEventType.MATCHMAKING_TIMED_OUT];

    public static isFailureEvent(eventType:string)
    {
        return FlexMatchEventType.failureEvents.includes(eventType);
    }
}