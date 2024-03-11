export class Runtime {
    static openScreen(config) {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }
    static openDialog(config) {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
}
window.RUNTIME = Runtime;
