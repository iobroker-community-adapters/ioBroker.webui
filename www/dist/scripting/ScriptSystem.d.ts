import { ScriptCommands } from "./ScriptCommands";
import { ScriptMultiplexValue } from "./ScriptValue";
export declare class ScriptSystem {
    execute(scriptCommands: ScriptCommands[], context: any): Promise<void>;
    getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any;
}
