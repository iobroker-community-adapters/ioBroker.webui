import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from "@node-projects/base-custom-webcomponent";
import { IUiCommand, IUiCommandHandler, sleep } from "@node-projects/web-component-designer";
import type * as monaco from 'monaco-editor';
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiMonacoEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {

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

    static readonly properties = {
        language: String,
        singleRow: Boolean,
        value: String
    }

    public async createModel(text: string) {
        await IobrokerWebuiMonacoEditor.initMonacoEditor();
        //@ts-ignore
        return monaco.editor.createModel(text, this.getLanguageName());
    }
    private _model: monaco.editor.ITextModel;
    public get model() {
        return this._model;
    }
    public set model(value: monaco.editor.ITextModel) {
        this._model = value;
        if (this._editor)
            this._editor.setModel(value);
    }

    #value: string = null;
    get value() {
        if (this._editor)
            return this._editor.getModel().getValue();
        return null;
    }
    set value(v) {
        this.#value = v;
        if (this._editor)
            this._editor.getModel().setValue(v);
    }

    language: 'css' | 'javascript' = 'css';
    singleRow: boolean = false;
    editPart: 'local' | 'globalStyle' | 'fontDeclarations';

    #readOnly = false;
    get readOnly() {
        return this.#readOnly;
    }
    set readOnly(v) {
        this.#readOnly = v;
        if (this._editor)
            this._editor.updateOptions({ readOnly: v })
    }

    private getLanguageName() {
        return this.language;
    }

    private _container: HTMLDivElement;
    private _editor: monaco.editor.IStandaloneCodeEditor;
    private static _initalized: boolean;

    constructor() {
        super();
    }

    static initMonacoEditor() {
        return new Promise(async resolve => {
            if (!IobrokerWebuiMonacoEditor._initalized) {
                await sleep(500);
                //@ts-ignore
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs', 'vs/css': { disabled: true } } });

                //@ts-ignore
                require(['vs/editor/editor.main'], () => {
                    resolve(undefined);
                    IobrokerWebuiMonacoEditor._initalized = true;
                    import('./importDescriptions.json', { assert: { type: 'json' } }).then(async json => {
                        let files: { name: string, file: string }[] = json.default;
                        const chunkSize = 500;
                        let libs: { content: string, filePath?: string }[] = [];
                        for (let i = 0; i < files.length; i += chunkSize) {
                            const chunk = files.slice(i, i + chunkSize);
                            let promises: Promise<void>[] = [];
                            chunk.forEach((f) => {
                                promises.push(LazyLoader.LoadText(f.file).then(content => {
                                    libs.push({ content, filePath: f.name });
                                }));
                            });
                            await Promise.allSettled(promises);
                        }
                        //@ts-ignore
                        monaco.languages.typescript.typescriptDefaults.setExtraLibs(libs);
                        //@ts-ignore
                        monaco.languages.typescript.javascriptDefaults.setExtraLibs(libs)
                    });
                });
            } else {
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

        this._container = this._getDomElement<HTMLDivElement>('container')

        await IobrokerWebuiMonacoEditor.initMonacoEditor();

        let options: monaco.editor.IStandaloneEditorConstructionOptions = {
            automaticLayout: true,
            language: this.getLanguageName(),
            fixedOverflowWidgets: true,
            minimap: {
                size: 'fill'
            },
            readOnly: this.#readOnly
        }

        if (this.singleRow) {
            options.minimap.enabled = false;
            options.lineNumbers = 'off';
            options.glyphMargin = false;
            options.folding = false;
            options.lineDecorationsWidth = 0;
            options.lineNumbersMinChars = 0;
        }

        //@ts-ignore
        this._editor = monaco.editor.create(this._container, options);
        if (this._model)
            this._editor.setModel(this._model);
        if (this.#value)
            this._editor.getModel().setValue(this.#value);

        if (this.singleRow) {
            this._editor.getModel().onDidChangeContent((e) => {
                this.dispatchEvent(new CustomEvent('value-changed'))
            });
        }
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

    async executeCommand(command: Omit<IUiCommand, 'type'> & { type: string }) {
        if (command.type == 'save') {
            if (this.language === 'css') {
                if (this.editPart === 'globalStyle')
                    iobrokerHandler.config.globalStyle = this.model.getValue();
                else if (this.editPart === 'fontDeclarations')
                    iobrokerHandler.config.fontDeclarations = this.model.getValue();
            } else if (this.language == 'javascript') {
                iobrokerHandler.config.globalScript = this.model.getValue();
            }
            await iobrokerHandler.saveConfig();
        }
    }

    canExecuteCommand(command: Omit<IUiCommand, 'type'> & { type: string }): boolean {
        if (command.type == 'save')
            return true;
        return false;
    }

    setSelection(lineStart: number, columnStart: number, lineEnd: number, columnEnd: number) {
        setTimeout(() => {
            this._editor.setSelection({ startLineNumber: lineStart, startColumn: columnStart, endLineNumber: lineEnd, endColumn: columnEnd });
            //@ts-ignore
            this._editor.revealRangeInCenterIfOutsideViewport(new monaco.Range(lineStart, columnStart, lineEnd, columnEnd), 1);
        }, 50);
    }
}


customElements.define('iobroker-webui-monaco-editor', IobrokerWebuiMonacoEditor);