import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { DocumentContainer, } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
export class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super(...arguments);
        //TODO: maybe reload designer, when bindings are disabled???
        this.bindingsEnabled = true;
        this.relativeBindingsPrefix = '';
    }
    get name() { return this._name; }
    async initialize(name, type, html, style, script, settings, properties, serviceContainer) {
        this.title = type + ' - ' + name;
        this._name = name;
        this._type = type;
        this._settings = settings ?? {};
        this.scriptModel = await window.appShell.javascriptEditor.createModel(script ?? '');
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
                    clearTimeout(timer);
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
            this.handlePropertyChanges();
        }
        this._configChangedListener = iobrokerHandler.configChanged.on(() => {
            this.documentContainer.additionalStyleString = iobrokerHandler.config?.globalStyle ?? '';
        });
        this.shadowRoot.appendChild(this.documentContainer);
        setTimeout(() => {
            this.applyBindings();
            this.documentContainer.designerView.designerCanvas.onContentChanged.on(() => {
                this.applyBindings();
            });
        }, 50);
    }
    applyBindings() {
        this.removeBindings();
        if (this.bindingsEnabled)
            this._webuiBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.documentContainer.designerView.designerCanvas.rootDesignItem.element, this.relativeBindingsPrefix, null);
    }
    removeBindings() {
        this._webuiBindings?.forEach(x => x());
        this._webuiBindings = null;
    }
    async executeCommand(command) {
        if (command.type == 'save') {
            let html = this.documentContainer.designerView.getHTML();
            let style = this.documentContainer.additionalData.model.getValue();
            let script = this.scriptModel.getValue();
            if (this._type == 'screen') {
                let screen = { html, style, script, settings: this._settings };
                await iobrokerHandler.saveScreen(this._name, screen);
            }
            else {
                let control = { html, style, script, settings: this._settings, properties: this._properties };
                await iobrokerHandler.saveCustomControl(this._name, control);
            }
        }
        else
            this.documentContainer.executeCommand(command);
    }
    canExecuteCommand(command) {
        if (command.type == 'save')
            return true;
        return this.documentContainer.canExecuteCommand(command);
    }
    deactivated() {
        window.appShell.controlpropertiesEditor.setProperties(null);
        window.appShell.settingsEditor.selectedObject = null;
        window.appShell.styleEditor.model = null;
        window.appShell.javascriptEditor.model = null;
        this._settingsChanged?.dispose();
    }
    activated() {
        window.appShell.styleEditor.model = this.documentContainer.additionalData.model;
        window.appShell.javascriptEditor.model = this.scriptModel;
        window.appShell.propertyGrid.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.treeViewExtended.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.eventsAssignment.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.controlpropertiesEditor.setProperties(this._properties);
        window.appShell.settingsEditor.typeName = this._type == 'control' ? 'IControlSettings' : 'IScreenSettings';
        window.appShell.settingsEditor.selectedObject = this._settings;
        this._settingsChanged = window.appShell.settingsEditor.propertyChanged.on(() => {
            this.handlePropertyChanges();
        });
    }
    handlePropertyChanges() {
        this.documentContainer.designerView.designerWidth = this._settings.width ?? '';
        this.documentContainer.designerView.designerHeight = this._settings.height ?? '';
    }
    dispose() {
        this.removeBindings();
        this.documentContainer.dispose();
        this._configChangedListener?.dispose();
        this._settingsChanged?.dispose();
        window.appShell.controlpropertiesEditor.setProperties(null);
        window.appShell.settingsEditor.selectedObject = null;
        window.appShell.styleEditor.model = null;
        window.appShell.javascriptEditor.model = null;
    }
}
IobrokerWebuiScreenEditor.template = html ``;
IobrokerWebuiScreenEditor.style = css ``;
customElements.define("iobroker-webui-screen-editor", IobrokerWebuiScreenEditor);
