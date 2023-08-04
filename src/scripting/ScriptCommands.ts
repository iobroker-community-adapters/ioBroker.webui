import { ScriptMultiplexValue } from "./ScriptValue";

export declare type ScriptCommands = OpenScreen |
    SetSignalValue | IncrementSignalValue | DecrementSignalValue |
    SetBitInSignal | ClearBitInSignal | ToggleBitInSignal |
    Javascript;

export class OpenScreen {
    type: 'openScreen' = 'openScreen';
    screen: string | ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
}

export class SetSignalValue {
    type: 'setSignalValue' = 'setSignalValue';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export class IncrementSignalValue {
    type: 'incrementSignalValue' = 'incrementSignalValue';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export class DecrementSignalValue {
    type: 'decrementSignalValue' = 'decrementSignalValue';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}

export class SetBitInSignal {
    type: 'setBitInSignal' = 'setBitInSignal';
    signal: string;
    bitNumber: number = 0;
}
export class ClearBitInSignal {
    type: 'clearBitInSignal' = 'clearBitInSignal';
    signal: string;
    bitNumber: number = 0;
}
export class ToggleBitInSignal {
    type: 'toggleBitInSignal' = 'toggleBitInSignal';
    signal: string;
    bitNumber: number = 0;
}

export class Javascript {
    type: 'javascript' = 'javascript';
    script: string;
}