import { ScriptCommands } from "./ScriptCommands.js";
import { ScriptMultiplexValue } from "./ScriptValue.js";
export declare class ScriptSystem {
    static execute(scriptCommands: ScriptCommands[], context: {
        event: Event;
        element: Element;
    }): Promise<void>;
    static getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any;
}
