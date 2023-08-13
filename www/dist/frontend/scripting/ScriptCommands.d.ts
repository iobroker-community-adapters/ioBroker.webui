export declare type ScriptCommands = OpenScreen | ToggleSignalValue | SetSignalValue | IncrementSignalValue | DecrementSignalValue | SetBitInSignal | ClearBitInSignal | ToggleBitInSignal | Javascript;
export interface OpenScreen {
    type: 'OpenScreen';
    screen: string;
    relativeSignalsPath: string;
    openInDialog: boolean;
}
export interface OpenUrl {
    type: 'OpenUrl';
    url: string;
    target: string;
    openInDialog: boolean;
}
export interface SetSignalValue {
    type: 'SetSignalValue';
    signal: string;
    value: string;
}
export interface ToggleSignalValue {
    type: 'ToggleSignalValue';
    signal: string;
}
export interface IncrementSignalValue {
    type: 'IncrementSignalValue';
    signal: string;
    value: number;
}
export interface DecrementSignalValue {
    type: 'DecrementSignalValue';
    signal: string;
    value: number;
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
