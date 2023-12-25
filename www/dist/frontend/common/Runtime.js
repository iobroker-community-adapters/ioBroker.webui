import { ScriptSystem } from "../scripting/ScriptSystem";
export class Runtime {
    static openScreen(config) {
        return ScriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }
    static openDialog(config) {
        return ScriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
}
