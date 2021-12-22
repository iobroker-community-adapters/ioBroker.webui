import { BaseCustomWebComponentConstructorAppend, css, html } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
export class IobrokerWebuiStyleEditor extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._parseAttributesToProperties();
    }
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
        this._container = this._getDomElement('container');
        await IobrokerWebuiStyleEditor.initMonacoEditor();
        //@ts-ignore
        this._editor = monaco.editor.create(this._container, {
            automaticLayout: true,
            value: this.text,
            language: 'css',
            minimap: {
                //@ts-ignore
                size: 'fill'
            },
            readOnly: this.readOnly
        });
        this._getDomElement('loading').style.display = 'none';
        if (this._text)
            this._editor.setValue(this._text);
        this._model = this._editor.getModel();
        this._model.onDidChangeContent((e) => {
            if (this.onTextChanged)
                this.onTextChanged(e);
        });
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
IobrokerWebuiStyleEditor.style = css `
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .errorDecoration {
            background-color: red !important;
        }
    `;
IobrokerWebuiStyleEditor.template = html `
        <style>@import "/node_modules/monaco-editor/min/vs/editor/editor.main.css";</style>
        <div id="container" style="width: 100%; height: 100%;"></div>
        <mcc-loading id="loading" text="loading monaco code editor" style="width: 100%;  height: 100%; position: absolute; top: 0; left: 0;"></mcc-loading>
    `;
IobrokerWebuiStyleEditor.properties = {
    text: String,
    readOnly: Boolean
};
customElements.define('iobroker-webui-style-editor', IobrokerWebuiStyleEditor);
