import { ScriptMultiplexValue } from "./ScriptValue";

export declare type ScriptCommands = OpenScreen |
    SetSignal | IncreaseSignal | DecreaseSignal |
    SetBit | ClearBit | ToggleBit |
    Javascript;

export class OpenScreen {
    type: 'openScreen' = 'openScreen';
    screen: string | ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
}

export class SetSignal {
    type: 'setSignal' = 'setSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export class IncreaseSignal {
    type: 'increaseSignal' = 'increaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export class DecreaseSignal {
    type: 'decreaseSignal' = 'decreaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}

export class SetBit {
    type: 'setBit' = 'setBit';
    signal: string;
    bitNumber: number = 0;
}
export class ClearBit {
    type: 'clearBit' = 'clearBit';
    signal: string;
    bitNumber: number = 0;
}
export class ToggleBit {
    type: 'toggleBit' = 'toggleBit';
    signal: string;
    bitNumber: number = 0;
}

export class Javascript {
    type: 'javascript' = 'javascript';
    script: string;
}