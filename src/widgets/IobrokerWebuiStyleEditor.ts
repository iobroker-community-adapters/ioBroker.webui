import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import type * as monaco from 'monaco-editor';

export class IobrokerWebuiStyleEditor extends BaseCustomWebComponentConstructorAppend {

    static readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .errorDecoration {
            background-color: red !important;
        }
    `;

    static readonly template = html`
        <div id="container" style="width: 100%; height: 100%; position: absolute;"></div>
    `;

    private _text: string;
    private _model: monaco.editor.ITextModel;
    public get text() {
        if (this._editor)
            return this._editor.getValue();
        return this._text;
    }
    public set text(value: string) {
        if (this._editor)
            this._editor.setValue(value == null ? '' : value);
        this._text = value;
    }

    private _errorLine: number;
    public get errorLine() {
        return this._errorLine;
    }
    public set errorLine(value: number) {
        if (this._editor && value >= 0) {
            this._editor.deltaDecorations([], [
                //@ts-ignore
                { range: new monaco.Range(value, 1, value, 1), options: { isWholeLine: true, inlineClassName: 'errorDecoration' } },
            ]);
        }
        this._errorLine = value;
    }

    public readOnly: boolean;

    public onTextChanged: (e) => void;

    static readonly properties = {
        text: String,
        readOnly: Boolean
    }

    private _container: HTMLDivElement;
    private _editor: monaco.editor.IStandaloneCodeEditor;
    private static _initalized: boolean;

    constructor() {
        super();
        this._parseAttributesToProperties();
    }

    static initMonacoEditor() {
        return new Promise(async resolve => {
            if (!IobrokerWebuiStyleEditor._initalized) {
                IobrokerWebuiStyleEditor._initalized = true;
                //@ts-ignore
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs', 'vs/css': { disabled: true } } });

                //@ts-ignore
                require(['vs/editor/editor.main'], () => {
                    resolve(undefined);
                });
            } else {
                resolve(undefined);
            }
        });
    }

    async ready() {
    //@ts-ignore
    const style = await import("monaco-editor/min/vs/editor/editor.main.css", { assert: { type: 'css' } });
    //@ts-ignore
    this.shadowRoot.adoptedStyleSheets = [style.default, this.constructor.style];

        this._container = this._getDomElement<HTMLDivElement>('container')

        setTimeout(async () => {
            await IobrokerWebuiStyleEditor.initMonacoEditor();

            //@ts-ignore
            this._editor = monaco.editor.create(this._container, {
                automaticLayout: true,
                value: this.text,
                language: 'css',
                minimap: {
                    size: 'fill'
                },
                readOnly: this.readOnly,
                fixedOverflowWidgets: true
            });
            if (this._text)
                this._editor.setValue(this._text);

            this._model = this._editor.getModel();
            this._model.onDidChangeContent((e) => {
                if (this.onTextChanged)
                    this.onTextChanged(e);
            });
        }, 1000);
    }

    undo() {
        this._editor.trigger('', 'undo', null)
    }

    redo() {
        this._editor.trigger('', 'redo', null)
    }

    copy() {
        this._editor.trigger('', 'editor.action.clipboardCopyAction', null)
    }

    paste() {
        this._editor.trigger('', 'editor.action.clipboardPasteAction', null)
    }

    cut() {
        this._editor.trigger('', 'editor.action.clipboardCutAction', null)
    }

    delete() {
        this._editor.trigger('', 'editor.action.clipboardDeleteAction', null)
    }
}

customElements.define('iobroker-webui-style-editor', IobrokerWebuiStyleEditor);