import { ScriptMultiplexValue } from "./ScriptValue";
export declare type ScriptCommands = OpenScreen | SetSignal | IncreaseSignal | DecreaseSignal | SetBit | ClearBit | ToggleBit | Javascript;
export declare class OpenScreen {
    type: 'openScreen';
    screen: string | ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
}
export declare class SetSignal {
    type: 'setSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export declare class IncreaseSignal {
    type: 'increaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export declare class DecreaseSignal {
    type: 'decreaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
export declare class SetBit {
    type: 'setBit';
    signal: string;
    bitNumber: number;
}
export declare class ClearBit {
    type: 'clearBit';
    signal: string;
    bitNumber: number;
}
export declare class ToggleBit {
    type: 'toggleBit';
    signal: string;
    bitNumber: number;
}
export declare class Javascript {
    type: 'javascript';
    script: string;
}
