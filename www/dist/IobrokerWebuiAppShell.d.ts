import '@node-projects/web-component-designer';
import { TreeViewExtended, PropertyGrid, PaletteTreeView, BindableObjectsBrowser } from '@node-projects/web-component-designer';
import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import "./widgets/IobrokerWebuiSolutionExplorer.js";
import "./runtime/ScreenViewer.js";
import "./widgets/IobrokerWebuiStyleEditor.js";
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
