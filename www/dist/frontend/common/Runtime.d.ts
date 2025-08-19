import type { OpenDialog, OpenScreen, WebuiScriptCommands } from "../scripting/IobrokerWebuiScriptCommands.js";
export declare class Runtime {
    static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void>;
    static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void>;
    static runSimpleScriptCommand<T extends WebuiScriptCommands>(scriptCommand: T): Promise<void>;
    static getParentScreen(screen: BaseScreenViewerAndControl, parentLevel?: number): BaseScreenViewerAndControl;
    static findParent<T>(element: Element, type: new (...args: any[]) => T, predicate?: (element: Element) => boolean): T;
}
