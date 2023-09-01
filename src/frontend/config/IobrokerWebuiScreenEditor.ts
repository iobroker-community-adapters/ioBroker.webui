import { BaseCustomWebComponentConstructorAppend, Disposable, css, html } from "@node-projects/base-custom-webcomponent"
import { DocumentContainer, IUiCommand, IUiCommandHandler, ServiceContainer, } from "@node-projects/web-component-designer"
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { IScreen } from "../interfaces/IScreen.js";
import { IControl } from "../interfaces/IControl.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";

export class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {

    private _name: string;
    public get name() { return this._name; }

    private _type: 'screen' | 'control';

    private _properties: Record<string, { type: string, values?: string[], default?: any }>;

    private _configChangedListener: Disposable;

    public documentContainer: DocumentContainer;

    public static override template = html``;

    public static override style = css``;

    private _bindings: (() => void)[]

    public async initialize(name: string, type: 'screen' | 'control', html: string, style: string, properties: Record<string, { type: string, values?: string[], default?: any }>, serviceContainer: ServiceContainer) {
        this.title = type + ' - ' + name;

        this._name = name;
        this._type = type;
        if (this._type == 'control') {
            this._properties = { ...properties } ?? {};
        }

        this.documentContainer = new DocumentContainer(serviceContainer);
        this.documentContainer.additionalStylesheets = [
            {
                name: "stylesheet.css",
                content: style ?? ''
            }
        ];
        this.documentContainer.instanceServiceContainer.designer = this;

        const model = await window.appShell.styleEditor.createModel(this.documentContainer.additionalStylesheets[0].content);
        this.documentContainer.additionalData = { model: model };
        let timer;
        let disableTextChangedEvent = false;
        model.onDidChangeContent((e) => {
            if (!disableTextChangedEvent) {
                if (timer)
                    clearTimeout(timer)
                timer = setTimeout(() => {
                    this.documentContainer.additionalStylesheets = [
                        {
                            name: "stylesheet.css",
                            content: model.getValue()
                        }
                    ];
                    timer = null;
                }, 250);
            }
        });
        this.documentContainer.additionalStylesheetChanged.on(() => {
            disableTextChangedEvent = true;
            if (model.getValue() !== this.documentContainer.additionalStylesheets[0].content)
                model.applyEdits([{ range: model.getFullModelRange(), text: this.documentContainer.additionalStylesheets[0].content, forceMoveMarkers: true }]);
            disableTextChangedEvent = false;
        });
        this.documentContainer.additionalStyleString = iobrokerHandler.config?.globalStyle ?? '';

        if (html) {
            this.documentContainer.designerView.parseHTML(html, true);
        }

        this._configChangedListener = iobrokerHandler.configChanged.on(() => {
            this.documentContainer.additionalStyleString = iobrokerHandler.config?.globalStyle ?? '';
        });

        this.shadowRoot.appendChild(this.documentContainer);

        requestAnimationFrame(() => {
            this.applyBindings();
            this.documentContainer.designerView.designerCanvas.onContentChanged.on(() => {
                this.applyBindings();
            });
        });
    }

    //TODO: maybe reload designer, when bindings are disabled???
    bindingsEnabled = true;
    applyBindings() {
        this.removeBindings();
        if (this.bindingsEnabled)
            this._bindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.documentContainer.designerView.designerCanvas.rootDesignItem.element, '', null);
    }

    removeBindings() {
        this._bindings?.forEach(x => x());
        this._bindings = null;
    }

    async executeCommand(command: IUiCommand) {
        if ((<string>command.type) == 'save') {
            let html = this.documentContainer.designerView.getHTML();
            let style = this.documentContainer.additionalData.model.getValue();
            if (this._type == 'screen') {
                let screen: IScreen = { html, style, settings: {} };
                await iobrokerHandler.saveScreen(this._name, screen);
            } else {
                let control: IControl = { html, style, settings: {}, properties: this._properties };
                await iobrokerHandler.saveCustomControl(this._name, control);
            }
        } else
            this.documentContainer.executeCommand(command);
    }

    canExecuteCommand(command: IUiCommand) {
        if ((<string>command.type) == 'save')
            return true;
        return this.documentContainer.canExecuteCommand(command);
    }

    activated() {
        window.appShell.styleEditor.model = this.documentContainer.additionalData.model;
        window.appShell.propertyGrid.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.treeViewExtended.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.eventsAssignment.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.controlpropertiesEditor.setProperties(this._properties);
    }

    dispose() {
        this.documentContainer.dispose();
        this._configChangedListener?.dispose();
        window.appShell.controlpropertiesEditor.setProperties(null);
    }
}

customElements.define("iobroker-webui-screen-editor", IobrokerWebuiScreenEditor);