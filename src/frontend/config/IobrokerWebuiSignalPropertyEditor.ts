import { IProperty } from "@node-projects/web-component-designer";
import { SignalPropertyEditor, VisualizationShell } from "@node-projects/web-component-designer-visualization-addons";
import { openSelectIdDialog } from "iobroker-webcomponent-object-selector/dist/selectIdHelper.js"

export class IobrokerWebuiSignalPropertyEditor extends SignalPropertyEditor {
    constructor(property: IProperty, shell: VisualizationShell) {
        super(property, shell);

        let btn = document.createElement('button');
        btn.textContent = 'IOB';
        btn.title = "iobroker signal selector";
        btn.onclick = async () => {
            var res = await openSelectIdDialog({ host: window.iobrokerHost, port: window.iobrokerPort, protocol: window.location.protocol, language: 'en', selected: this._ip.value, allowAll: true })
            if (res) {
                this._ip.value = res;
                this._valueChanged(this._ip.value);
            }
        }
        this._container.appendChild(btn);
    }
}