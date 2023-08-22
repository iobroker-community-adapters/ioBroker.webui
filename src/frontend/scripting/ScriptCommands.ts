//import { ScriptMultiplexValue } from "./ScriptValue";

export declare type ScriptCommands = OpenScreen | OpenUrl |
    ToggleSignalValue | SetSignalValue | IncrementSignalValue | DecrementSignalValue |
    SetBitInSignal | ClearBitInSignal | ToggleBitInSignal |
    Javascript;

export interface OpenScreen {
    type: 'OpenScreen';
    screen: string //| ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
    noHistory: boolean;
}

export interface OpenUrl {
    type: 'OpenUrl';
    url: string //| ScriptMultiplexValue;
    target: string;
    openInDialog: boolean;
}

export interface SetSignalValue {
    type: 'SetSignalValue';
    signal: string;
    value: string //| number | boolean | ScriptMultiplexValue;
}

export interface ToggleSignalValue {
    type: 'ToggleSignalValue';
    signal: string;
}

export interface IncrementSignalValue {
    type: 'IncrementSignalValue';
    signal: string;
    value: number //| ScriptMultiplexValue;
}

export interface DecrementSignalValue {
    type: 'DecrementSignalValue';
    signal: string;
    value: number //| ScriptMultiplexValue;
}

export interface SetBitInSignal {
    type: 'SetBitInSignal';
    signal: string;
    bitNumber: number;
}
export interface ClearBitInSignal {
    type: 'ClearBitInSignal';
    signal: string;
    bitNumber: number;
}
export interface ToggleBitInSignal {
    type: 'ToggleBitInSignal';
    signal: string;
    bitNumber: number;
}

export interface Javascript {
    type: 'Javascript';
    script: string;
}