export class IScriptMultiplexValue {
    /**
     * Name of the ioBroker object or the property of the component
     * or for example in a event : srcElement.value to get the value of a input wich raises the event
     * @TJS-format signal
     */
    name: string;
    source: 'signal' | 'property' | 'event'
}