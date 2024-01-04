export class IScriptMultiplexValue {
    source: 'signal' | 'property' | 'event';
    /**
     * Name of the ioBroker object or the property of the component
     * or for example in a event : srcElement.value to get the value of a input wich raises the event
     * @TJS-format signal
     */
    name: string;
}