import type { OpenDialog, OpenScreen, WebuiScriptCommands } from "../scripting/IobrokerWebuiScriptCommands.js";
import { BaseCustomControl } from "../runtime/CustomControls.js";
import type { ScreenViewer } from "../runtime/ScreenViewer.js";
type BaseScreenViewerAndControl = ScreenViewer | BaseCustomControl;

export class Runtime {
    public static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void> {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }

    public static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void> {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }

    public static async runSimpleScriptCommand<T extends WebuiScriptCommands>(scriptCommand: T): Promise<void> {
        await window.appShell.scriptSystem.runScriptCommand(scriptCommand, null); //TODO context
    }

    public static getParentScreen(screen: BaseScreenViewerAndControl, parentLevel = 1): BaseScreenViewerAndControl {
        let el: Element = screen;
        for (let i = 0; i < parentLevel; i++) {
            let rootDiv = (<ShadowRoot>el.getRootNode()).host;
            if (rootDiv instanceof BaseCustomControl)
                el = rootDiv;
            else
                el = (<ShadowRoot>rootDiv.getRootNode()).host;
        }
        return <BaseScreenViewerAndControl>el;
    }

    public static findParent<T>(element: Element, type: new (...args: any[]) => T, predicate?: (element: Element) => boolean): T {
        let current: Element | ShadowRoot = element;
        while (current) {
            if (current instanceof type && current !== element) {
                if (predicate == null || predicate(<Element>current))
                    return current;
            }
            if (current.parentNode)
                current = <Element>current.parentNode;
            else
                current = (<ShadowRoot><unknown>current).host;
        }
        return null;
    }
}

//@ts-ignore
window.RUNTIME = Runtime;