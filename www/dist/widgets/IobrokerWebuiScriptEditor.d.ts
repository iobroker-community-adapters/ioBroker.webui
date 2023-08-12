import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { Script } from "../scripting/Script.js";
import { IUiCommand, IUiCommandHandler } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiScriptEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    static readonly is = "vscript-editor";
    private _script;
    private _commandListDiv;
    private _commandListFancyTree;
    private _possibleCommands;
    private _propertygrid;
    constructor();
    ready(): Promise<void>;
    private _getTypeInfo;
    private addPossibleCommands;
    loadScript(script: Script): void;
    private createTreeItem;
    addItem(): void;
    private removeItem;
    getScriptCommands(): any[];
    executeCommand(command: IUiCommand | {
        type: string;
    }): Promise<void>;
    canExecuteCommand(command: IUiCommand | {
        type: string;
    }): boolean;
}
