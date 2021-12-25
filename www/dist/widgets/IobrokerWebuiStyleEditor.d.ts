import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiStyleEditor extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    private _text;
    private _model;
    get text(): string;
    set text(value: string);
    private _errorLine;
    get errorLine(): number;
    set errorLine(value: number);
    readOnly: boolean;
    onTextChanged: (e: any) => void;
    static readonly properties: {
        text: StringConstructor;
        readOnly: BooleanConstructor;
    };
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
}
