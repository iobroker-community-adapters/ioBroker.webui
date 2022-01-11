import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { ServiceContainer } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    private _treeDiv;
    private _tree;
    serviceContainer: ServiceContainer;
    constructor();
    ready(): Promise<void>;
    initialize(serviceContainer: ServiceContainer): void;
    private createTreeNodes;
    private _createscreensNode;
    private _createNpmsNode;
    private _createChartsNode;
    private _createControlsNode;
    private _createObjectsNode;
    private lazyLoad;
    private _loadTree;
}
