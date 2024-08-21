import type { OpenDialog, OpenScreen } from "@node-projects/web-component-designer-visualization-addons";

export class Runtime {
    public static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void> {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }

    public static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void> {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }

    public static getParentScreen(screen: BaseScreenViewerAndControl): BaseScreenViewerAndControl {
        return <BaseScreenViewerAndControl>(<ShadowRoot>(<ShadowRoot>screen.getRootNode()).host.getRootNode()).host;
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
window.RUNTIME = Runtime;