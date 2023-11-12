export declare type ScriptCommands = OpenScreen | OpenUrl | OpenDialog | CloseDialog |
    ToggleSignalValue | SetSignalValue | IncrementSignalValue | DecrementSignalValue |
    SetBitInSignal | ClearBitInSignal | ToggleBitInSignal |
    Javascript | SetElementProperty | Delay | IobrokerSendTo | SwitchLanguage;


/* 
TODO:
Indirect Values in Scripts:
 
Indirection Source:
Object Values,
Current Element Property
 */


export interface OpenScreen {
    type: 'OpenScreen';
    /**
     * Name of the Screen
     * @TJS-format screen
     */
    screen: string;
    /**
     * If signals in screen are defined relative (starting with a '.'), this will be prepended
     */
    relativeSignalsPath: string;
    noHistory: boolean;
}

export interface OpenDialog {
    type: 'OpenDialog';
    /**
     * Name of the Screen
     * @TJS-format screen
     */
    screen: string;
    /**
     * If signals in screen are defined relative (starting with a '.'), this will be prepended
     */
    relativeSignalsPath: string;
    title: string;
    moveable: boolean;

    width?: string;
    height?: string;

    left?: string;
    top?: string;
    /**
     * Name of the ioBroker object in wich the dialogId is stored
     * @TJS-format signal
     */
    //dialogId: string;
}

//TODO: dialogId, closeChildDialogs
export interface CloseDialog {
    type: 'CloseDialog';
    /**
     * A dialogId. If empty the parent dialog will be closed
     * @TJS-format signal
     */
    //dialogId: string;
}

export interface OpenUrl {
    type: 'OpenUrl';
    url: string;
    /**
     * defaults to '_blank'
     */
    target: string;
    openInDialog: boolean;
}

export interface SetSignalValue {
    type: 'SetSignalValue';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
    value: string;
}

export interface ToggleSignalValue {
    type: 'ToggleSignalValue';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
}

export interface IncrementSignalValue {
    type: 'IncrementSignalValue';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
    value: number;
}

export interface DecrementSignalValue {
    type: 'DecrementSignalValue';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
    value: number;
}

export interface SetBitInSignal {
    type: 'SetBitInSignal';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
    bitNumber: number;
}
export interface ClearBitInSignal {
    type: 'ClearBitInSignal';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
    bitNumber: number;
}
export interface ToggleBitInSignal {
    type: 'ToggleBitInSignal';
    /**
     * Name of the ioBroker object
     * @TJS-format signal
     */
    signal: string;
    bitNumber: number;
}

export interface Javascript {
    type: 'Javascript';
    /**
     * Usable objects in Script: 
     * context : {event : Event, element: Element, shadowRoot: ShadowRoot, instance: Element }
     * @TJS-format script
     */
    script: string;
}

export interface SetElementProperty {
    type: 'SetElementProperty';
    /**
     * what of the elements do you want to set
     */
    target: 'property' | 'attribute' | 'css';
    /**
     * where to search for the elements
     */
    targetSelectorTarget: 'currentScreen' | 'parentScreen' | 'currentElement' | 'parentElement';
    /**
     * css selector to find elements, if empty the targetSelectorTarget is used
     */
    targetSelector: string;
    /**
     * name of property/attribute or css value you want to set
     */
    name: string;
    /**
     * value you want to set
     */
    value: any;
}

export interface Delay {
    type: 'Delay';
    /**
     * miliseconds to delay
     */
    value: number;
}

export interface SwitchLanguage {
    type: 'SwitchLanguage';
    language: string;
}

export interface IobrokerSendTo {
    type: 'IobrokerSendTo';
    instance: string;
    command: string;
    data: string;
}

