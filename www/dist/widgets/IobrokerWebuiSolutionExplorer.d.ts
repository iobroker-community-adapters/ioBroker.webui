import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    private _treeDiv;
    private _tree;
    constructor();
    private createTreeNodes;
    private _loadTree;
    ready(): Promise<void>;
}
