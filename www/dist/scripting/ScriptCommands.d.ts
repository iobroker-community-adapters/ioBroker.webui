import { ScriptMultiplexValue } from "./ScriptValue";
declare class OpenScreen {
    type: 'openScreen';
    screen: string | ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
}
declare class SetSignal {
    type: 'setSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
declare class IncreaseSignal {
    type: 'increaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
declare class DecreaseSignal {
    type: 'decreaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
declare class SetBit {
    type: 'setBit';
    signal: string;
    bitNumber: number;
}
declare class ClearBit {
    type: 'clearBit';
    signal: string;
    bitNumber: number;
}
declare class ToggleBit {
    type: 'toggleBit';
    signal: string;
    bitNumber: number;
}
declare class Javascript {
    type: 'javascript';
    script: string;
}
declare type ScriptCommands = OpenScreen | SetSignal | IncreaseSignal | DecreaseSignal | SetBit | ClearBit | ToggleBit | Javascript;
export declare class ScriptSystem {
    execute(scriptCommands: ScriptCommands[], context: any): Promise<void>;
    getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any;
}
export {};
