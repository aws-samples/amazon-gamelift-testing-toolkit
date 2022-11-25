export class QueuePlacementEventType
{
    public static PLACEMENT_FULFILLED:string = "PlacementFulfilled";
    public static PLACEMENT_CANCELLED:string = "PlacementCancelled";
    public static PLACEMENT_TIMED_OUT:string = "PlacementTimedOut";
    public static PLACEMENT_FAILED:string = "PlacementFailed";

    public static failureEvents:string[] = [
        QueuePlacementEventType.PLACEMENT_CANCELLED, QueuePlacementEventType.PLACEMENT_TIMED_OUT, QueuePlacementEventType.PLACEMENT_FAILED,
    ];

    public static isFailureEvent(eventType:string)
    {
        return QueuePlacementEventType.failureEvents.includes(eventType);
    }
}