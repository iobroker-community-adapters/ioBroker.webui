import '@node-projects/web-component-designer';
import { TreeViewExtended, PropertyGrid } from '@node-projects/web-component-designer';
import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import "../runtime/controls.js";
import "./IobrokerWebuiSolutionExplorer.js";
import "./IobrokerWebuiStyleEditor.js";
import "./IobrokerWebuiEventAssignment.js";
import "./IobrokerWebuiSplitView.js";
import "./IobrokerWebuiPropertyGrid.js";
import "./IobrokerWebuiControlPropertiesEditor.js";
import { IobrokerWebuiSolutionExplorer } from './IobrokerWebuiSolutionExplorer.js';
import { IobrokerWebuiStyleEditor } from './IobrokerWebuiStyleEditor.js';
import { IobrokerWebuiEventAssignment } from './IobrokerWebuiEventAssignment.js';
import { IobrokerWebuiControlPropertiesEditor } from './IobrokerWebuiControlPropertiesEditor.js';
export declare class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement: HTMLElement;
    mainPage: string;
    private _dock;
    private _dockManager;
    _solutionExplorer: IobrokerWebuiSolutionExplorer;
    styleEditor: IobrokerWebuiStyleEditor;
    controlpropertiesEditor: IobrokerWebuiControlPropertiesEditor;
    propertyGrid: PropertyGrid;
    treeViewExtended: TreeViewExtended;
    eventsAssignment: IobrokerWebuiEventAssignment;
    npmState: string;
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    ready(): Promise<void>;
    private _setupServiceContainer;
    openDock(element: HTMLElement): void;
    openDialog(element: HTMLElement, x: number, y: number, width: number, height: number, parent?: HTMLElement): {
        close: () => void;
    };
    openConfirmation(element: HTMLElement, x: number, y: number, width: number, height: number, parent?: HTMLElement): Promise<boolean>;
    openScreenEditor(name: string, type: 'screen' | 'control', html: string, style: string, properties?: Record<string, string>): Promise<void>;
    openGlobalStyleEditor(style: string): Promise<void>;
}
declare global {
    interface Window {
        appShell: IobrokerWebuiAppShell;
    }
}
