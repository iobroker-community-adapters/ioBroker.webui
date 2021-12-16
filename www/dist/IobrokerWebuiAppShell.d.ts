import { TreeViewExtended, PropertyGrid, PaletteTreeView } from '@node-projects/web-component-designer';
import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import "./IobrokerHandler.js";
import "./widgets/IobrokerSolutionExplorer.js";
import "./runtime/ScreenViewer.js";
export declare class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement: HTMLElement;
    mainPage: string;
    private _dock;
    private _dockManager;
    _paletteTree: PaletteTreeView;
    _propertyGrid: PropertyGrid;
    _treeViewExtended: TreeViewExtended;
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    ready(): Promise<void>;
    private _setupServiceContainer;
    newDocument(name: string, content: string): void;
}
declare global {
    interface Window {
        appShell: IobrokerWebuiAppShell;
    }
}
