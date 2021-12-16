import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import "../SocketIoFork.js";
export declare class IobrokerSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    private _treeDiv;
    private _tree;
    constructor();
    private createTreeNodes;
    private _loadTree;
    ready(): Promise<void>;
}
