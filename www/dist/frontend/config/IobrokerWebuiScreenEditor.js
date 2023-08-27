import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { DocumentContainer, } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
export class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend {
    get name() { return this._name; }
    async initialize(name, type, html, style, properties, serviceContainer) {
        this.title = type + ' - ' + name;
        this._name = name;
        this._type = type;
        if (this._type == 'control') {
            this._properties = properties ?? {};
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
        }
        this._configChangedListener = iobrokerHandler.configChanged.on(() => {
            this.documentContainer.additionalStyleString = iobrokerHandler.config?.globalStyle ?? '';
        });
        this.shadowRoot.appendChild(this.documentContainer);
    }
    async executeCommand(command) {
        if (command.type == 'save') {
            let html = this.documentContainer.designerView.getHTML();
            let style = this.documentContainer.additionalData.model.getValue();
            if (this._type == 'screen') {
                let screen = { html, style, settings: {} };
                await iobrokerHandler.saveScreen(this._name, screen);
            }
            else {
                let control = { html, style, settings: {}, properties: this._properties };
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
IobrokerWebuiScreenEditor.template = html ``;
IobrokerWebuiScreenEditor.style = css ``;
customElements.define("iobroker-webui-screen-editor", IobrokerWebuiScreenEditor);
