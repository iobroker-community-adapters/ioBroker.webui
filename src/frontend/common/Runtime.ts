import { OpenDialog, OpenScreen } from "../scripting/ScriptCommands";
import { ScriptSystem } from "../scripting/ScriptSystem";

export class Runtime {
    public static openScreen(config: Omit<OpenScreen, 'type'>) {
        return ScriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }

    public static openDialog(config: Omit<OpenDialog, 'type'>) {
        return ScriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
}