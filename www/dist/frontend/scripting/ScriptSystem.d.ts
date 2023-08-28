import { ScriptCommands } from "./ScriptCommands.js";
import { ScriptMultiplexValue } from "./ScriptValue.js";
export declare class ScriptSystem {
    static execute(scriptCommands: ScriptCommands[], outerContext: {
        event: Event;
        element: Element;
        root: HTMLElement;
    }): Promise<void>;
    static getValue(value: string | number | boolean | ScriptMultiplexValue, outerContext: {
        event: Event;
        element: Element;
        root: HTMLElement;
    }): Promise<any>;
    static assignAllScripts(shadowRoot: ShadowRoot, instance: HTMLElement): Promise<void>;
}
