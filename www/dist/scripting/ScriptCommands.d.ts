import { ScriptMultiplexValue } from "./ScriptValue";
export declare type ScriptCommands = OpenScreen | SetSignalValue | IncrementSignalValue | DecrementSignalValue | SetBitInSignal | ClearBitInSignal | ToggleBitInSignal | Javascript;
export declare class OpenScreen {
    type: 'openScreen';
    screen: string | ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
}
export declare class SetSignalValue {
    type: 'setSignalValue';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export declare class IncrementSignalValue {
    type: 'incrementSignalValue';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export declare class DecrementSignalValue {
    type: 'decrementSignalValue';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export declare class SetBitInSignal {
    type: 'setBitInSignal';
    signal: string;
    bitNumber: number;
}
export declare class ClearBitInSignal {
    type: 'clearBitInSignal';
    signal: string;
    bitNumber: number;
}
export declare class ToggleBitInSignal {
    type: 'toggleBitInSignal';
    signal: string;
    bitNumber: number;
}
export declare class Javascript {
    type: 'javascript';
    script: string;
}
