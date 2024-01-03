import { OpenDialog, OpenScreen } from "../scripting/ScriptCommands.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";

export class Runtime {
    public static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void> {
        return ScriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }

    public static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void> {
        return ScriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
}
window.runtime = Runtime;