import '@node-projects/web-component-designer';
import { TreeViewExtended, PropertyGrid } from '@node-projects/web-component-designer';
import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import "../runtime/ScreenViewer.js";
import "../runtime/SvgImage.js";
import "./IobrokerWebuiSolutionExplorer.js";
import "./IobrokerWebuiStyleEditor.js";
import "./IobrokerWebuiEventAssignment.js";
import "./IobrokerWebuiSplitView.js";
import "./IobrokerWebuiPropertyGrid.js";
import { IobrokerWebuiSolutionExplorer } from './IobrokerWebuiSolutionExplorer.js';
import { IobrokerWebuiStyleEditor } from './IobrokerWebuiStyleEditor.js';
import { IobrokerWebuiEventAssignment } from './IobrokerWebuiEventAssignment.js';
export declare class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement: HTMLElement;
    mainPage: string;
    private _dock;
    private _dockManager;
    _solutionExplorer: IobrokerWebuiSolutionExplorer;
    styleEditor: IobrokerWebuiStyleEditor;
    propertyGrid: PropertyGrid;
    treeViewExtended: TreeViewExtended;
    eventsAssignment: IobrokerWebuiEventAssignment;
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    ready(): Promise<void>;
    private _setupServiceContainer;
    openDock(element: HTMLElement): void;
    openDialog(element: HTMLElement, x: number, y: number, width: number, height: number): {
        close: () => void;
    };
    openScreenEditor(name: string, html: string, style: string): Promise<void>;
    openGlobalStyleEditor(style: string): Promise<void>;
}
declare global {
    interface Window {
        appShell: IobrokerWebuiAppShell;
    }
}
