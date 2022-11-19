import { BaseCustomWebComponentConstructorAppend, css, html } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
export class IobrokerWebuiStyleEditor extends BaseCustomWebComponentConstructorAppend {
    static style = css `
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .errorDecoration {
            background-color: red !important;
        }
    `;
    static template = html `
        <div id="container" style="width: 100%; height: 100%; position: absolute;"></div>
    `;
    _text;
    _model;
    get text() {
        if (this._editor)
            return this._editor.getValue();
        return this._text;
    }
    set text(value) {
        if (this._editor)
            this._editor.setValue(value == null ? '' : value);
        this._text = value;
    }
    _errorLine;
    get errorLine() {
        return this._errorLine;
    }
    set errorLine(value) {
        if (this._editor && value >= 0) {
            this._editor.deltaDecorations([], [
                //@ts-ignore
                { range: new monaco.Range(value, 1, value, 1), options: { isWholeLine: true, inlineClassName: 'errorDecoration' } },
            ]);
        }
        this._errorLine = value;
    }
    readOnly;
    onTextChanged;
    static properties = {
        text: String,
        readOnly: Boolean
    };
    _container;
    _editor;
    static _initalized;
    constructor() {
        super();
        this._parseAttributesToProperties();
    }
    static initMonacoEditor() {
        return new Promise(async (resolve) => {
            if (!IobrokerWebuiStyleEditor._initalized) {
                IobrokerWebuiStyleEditor._initalized = true;
                //@ts-ignore
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs', 'vs/css': { disabled: true } } });
                //@ts-ignore
                require(['vs/editor/editor.main'], () => {
                    resolve(undefined);
                });
            }
            else {
                resolve(undefined);
            }
        });
    }
    async ready() {
        //@ts-ignore
        const style = await import('/webui/node_modules/monaco-editor/min/vs/editor/editor.main.css', { assert: { type: 'css' } });
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [style.default, this.constructor.style];
        this._container = this._getDomElement('container');
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
        this._editor.trigger('', 'undo', null);
    }
    redo() {
        this._editor.trigger('', 'redo', null);
    }
    copy() {
        this._editor.trigger('', 'editor.action.clipboardCopyAction', null);
    }
    paste() {
        this._editor.trigger('', 'editor.action.clipboardPasteAction', null);
    }
    cut() {
        this._editor.trigger('', 'editor.action.clipboardCutAction', null);
    }
    delete() {
        this._editor.trigger('', 'editor.action.clipboardDeleteAction', null);
    }
}
customElements.define('iobroker-webui-style-editor', IobrokerWebuiStyleEditor);
