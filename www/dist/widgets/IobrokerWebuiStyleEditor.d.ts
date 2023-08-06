import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { IUiCommand, IUiCommandHandler } from "@node-projects/web-component-designer";
import type * as monaco from 'monaco-editor';
export declare class IobrokerWebuiStyleEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    createModel(text: string): Promise<monaco.editor.ITextModel>;
    private _model;
    get model(): monaco.editor.ITextModel;
    set model(value: monaco.editor.ITextModel);
    private _errorLine;
    get errorLine(): number;
    set errorLine(value: number);
    private _container;
    private _editor;
    private static _initalized;
    constructor();
    static initMonacoEditor(): Promise<unknown>;
    ready(): Promise<void>;
    undo(): void;
    redo(): void;
    copy(): void;
    paste(): void;
    cut(): void;
    delete(): void;
    executeCommand(command: Omit<IUiCommand, 'type'> & {
        type: string;
    }): Promise<void>;
    canExecuteCommand(command: Omit<IUiCommand, 'type'> & {
        type: string;
    }): boolean;
}
