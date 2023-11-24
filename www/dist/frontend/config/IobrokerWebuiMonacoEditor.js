import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from "@node-projects/base-custom-webcomponent";
import { sleep } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
export class IobrokerWebuiMonacoEditor extends BaseCustomWebComponentConstructorAppend {
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
    static properties = {
        language: String
    };
    async createModel(text) {
        await IobrokerWebuiMonacoEditor.initMonacoEditor();
        //@ts-ignore
        return monaco.editor.createModel(text, this.language);
    }
    _model;
    get model() {
        return this._model;
    }
    set model(value) {
        this._model = value;
        if (this._editor)
            this._editor.setModel(value);
    }
    language = 'css';
    editPart;
    _container;
    _editor;
    static _initalized;
    constructor() {
        super();
    }
    static initMonacoEditor() {
        return new Promise(async (resolve) => {
            if (!IobrokerWebuiMonacoEditor._initalized) {
                await sleep(500);
                //@ts-ignore
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs', 'vs/css': { disabled: true } } });
                //@ts-ignore
                require(['vs/editor/editor.main'], () => {
                    resolve(undefined);
                    IobrokerWebuiMonacoEditor._initalized = true;
                    import('./importDescriptions.json', { assert: { type: 'json' } }).then(async (json) => {
                        let files = json.default;
                        const chunkSize = 500;
                        let libs = [];
                        for (let i = 0; i < files.length; i += chunkSize) {
                            const chunk = files.slice(i, i + chunkSize);
                            let promises = [];
                            chunk.forEach((f) => {
                                promises.push(LazyLoader.LoadText(f.file).then(content => {
                                    libs.push({ content, filePath: f.name });
                                }));
                            });
                            await Promise.allSettled(promises);
                        }
                        //@ts-ignore
                        monaco.languages.typescript.typescriptDefaults.setExtraLibs(libs);
                    });
                });
            }
            else {
                resolve(undefined);
            }
        });
    }
    async ready() {
        this._parseAttributesToProperties();
        //@ts-ignore
        const style = await import("monaco-editor/min/vs/editor/editor.main.css", { assert: { type: 'css' } });
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [style.default, this.constructor.style];
        this._container = this._getDomElement('container');
        await IobrokerWebuiMonacoEditor.initMonacoEditor();
        //@ts-ignore
        this._editor = monaco.editor.create(this._container, {
            automaticLayout: true,
            language: this.language,
            minimap: {
                size: 'fill'
            },
            fixedOverflowWidgets: true
        });
        if (this._model)
            this._editor.setModel(this._model);
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
    static async getCompiledJavascriptCode(model) {
        const uri = model.uri;
        //@ts-ignore
        const worker = await monaco.languages.typescript.getTypeScriptWorker();
        const client = await worker(uri);
        const result = await client.getEmitOutput(uri.toString());
        return result.outputFiles[0].text;
    }
    async executeCommand(command) {
        if (command.type == 'save') {
            if (this.language === 'css') {
                if (this.editPart === 'globalStyle')
                    iobrokerHandler.config.globalStyle = this.model.getValue();
                else if (this.editPart === 'fontDeclarations')
                    iobrokerHandler.config.fontDeclarations = this.model.getValue();
            }
            else if (this.language == 'typescript') {
                iobrokerHandler.config.globalTypeScript = this.model.getValue();
                iobrokerHandler.config.globalScript = await IobrokerWebuiMonacoEditor.getCompiledJavascriptCode(this.model);
            }
            await iobrokerHandler.saveConfig();
        }
    }
    canExecuteCommand(command) {
        if (command.type == 'save')
            return true;
        return false;
    }
    setSelection(lineStart, columnStart, lineEnd, columnEnd) {
        setTimeout(() => {
            this._editor.setSelection({ startLineNumber: lineStart, startColumn: columnStart, endLineNumber: lineEnd, endColumn: columnEnd });
            //@ts-ignore
            this._editor.revealRangeInCenterIfOutsideViewport(new monaco.Range(lineStart, columnStart, lineEnd, columnEnd), 1);
        }, 50);
    }
}
customElements.define('iobroker-webui-monaco-editor', IobrokerWebuiMonacoEditor);
