import '../node_modules/@node-projects/web-component-designer/dist/index.js';
import { TreeViewExtended, PropertyGrid, PaletteTreeView, BindableObjectsBrowser } from '@node-projects/web-component-designer';
import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import "./IobrokerHandler.js";
import "./widgets/IobrokerWebuiSolutionExplorer.js";
import "./runtime/ScreenViewer.js";
export declare class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement: HTMLElement;
    mainPage: string;
    private _dock;
    private _dockManager;
    _paletteTree: PaletteTreeView;
    _propertyGrid: PropertyGrid;
    _treeViewExtended: TreeViewExtended;
    _bindableObjectsBrowser: BindableObjectsBrowser;
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
