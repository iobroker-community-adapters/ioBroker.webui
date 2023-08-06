import { ScriptCommands } from "./ScriptCommands.js";
import { ScriptMultiplexValue } from "./ScriptValue.js";
export declare class ScriptSystem {
    execute(scriptCommands: ScriptCommands[], context: any): Promise<void>;
    getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any;
}
