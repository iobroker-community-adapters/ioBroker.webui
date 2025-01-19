import type { OpenDialog, OpenScreen, ScriptCommands } from "@node-projects/web-component-designer-visualization-addons";
export declare class Runtime {
    static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void>;
    static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void>;
    static runSimpleScriptCommand<T extends ScriptCommands>(scriptCommand: T): Promise<void>;
    static getParentScreen(screen: BaseScreenViewerAndControl, parentLevel?: number): BaseScreenViewerAndControl;
    static findParent<T>(element: Element, type: new (...args: any[]) => T, predicate?: (element: Element) => boolean): T;
}
