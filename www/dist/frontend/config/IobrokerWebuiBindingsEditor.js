import { BindingsEditor } from "@node-projects/web-component-designer-visualization-addons";
import { openSelectIdDialog } from "iobroker.iobroker-webcomponent-object-selector/dist/selectIdHelper.js";
//@ts-ignore
export class IobrokerWebuiBindingsEditor extends BindingsEditor {
    static is = 'iobroker-webui-bindings-editor';
    constructor(property, binding, bindingTarget, serviceContainer, instanceServiceContainer, shell) {
        super(property, binding, bindingTarget, serviceContainer, instanceServiceContainer, shell);
        let groupObjectNameControl = this._getDomElement('groupObjectName');
        let btn = document.createElement('button');
        btn.textContent = 'IOB';
        btn.title = "iobroker signal selector";
        btn.style.height = '22px';
        btn.onclick = async () => {
            var res = await openSelectIdDialog({ host: window.iobrokerHost, port: window.iobrokerPort, protocol: window.location.protocol, language: 'en', selected: '', allowAll: true });
            if (res) {
                if (this.objectNames.length > 1)
                    this.objectNames += ";";
                this.objectNames += res;
                this._bindingsRefresh();
            }
        };
        groupObjectNameControl.appendChild(btn);
    }
}
customElements.define(IobrokerWebuiBindingsEditor.is, IobrokerWebuiBindingsEditor);
