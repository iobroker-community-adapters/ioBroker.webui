import type { OpenDialog, OpenScreen, WebuiScriptCommands } from "../scripting/IobrokerWebuiScriptCommands.js";
import { BaseCustomControl } from "../runtime/CustomControls.js";
import type { ScreenViewer } from "../runtime/ScreenViewer.js";
type BaseScreenViewerAndControl = ScreenViewer | BaseCustomControl;
export declare class Runtime {
    static openScreen(config: Omit<OpenScreen, 'type'>): Promise<boolean>;
    static openDialog(config: Omit<OpenDialog, 'type'>): Promise<boolean>;
    static runSimpleScriptCommand<T extends WebuiScriptCommands>(scriptCommand: T): Promise<void>;
    static getParentScreen(screen: BaseScreenViewerAndControl, parentLevel?: number): BaseScreenViewerAndControl;
    static findParent<T>(element: Element, type: new (...args: any[]) => T, predicate?: (element: Element) => boolean): T;
}
export {};
