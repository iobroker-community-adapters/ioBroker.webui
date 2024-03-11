import { OpenDialog, OpenScreen } from "@node-projects/web-component-designer-visualization-addons";

export class Runtime {
    public static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void> {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }

    public static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void> {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
}
window.RUNTIME = Runtime;