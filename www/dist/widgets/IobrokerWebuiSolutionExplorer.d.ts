import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { ServiceContainer } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    serviceContainer: ServiceContainer;
    private _treeDiv;
    private _tree;
    private _screensNode;
    constructor();
    ready(): Promise<void>;
    initialize(serviceContainer: ServiceContainer): Promise<void>;
    private createTreeNodes;
    private _createScreensNode;
    private _refreshScreensNode;
    private _createGlobalStyleNode;
    private _createNpmsNode;
    private _createIconsFolderNode;
    private _createIconsNodes;
    private _createChartsNode;
    private _createControlsNode;
    private _createObjectsNode;
    private _lazyLoadObjectNodes;
    private _loadTree;
}
