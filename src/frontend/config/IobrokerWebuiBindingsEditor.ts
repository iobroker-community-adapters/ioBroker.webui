import { BindingTarget, IBinding, InstanceServiceContainer, IProperty, ServiceContainer } from "@node-projects/web-component-designer";
import { BindingsEditor, VisualizationShell } from "@node-projects/web-component-designer-visualization-addons";
//@ts-ignore
import { openSelectIdDialog } from "@iobroker/webcomponent-selectid-dialog/build/selectIdHelper.js"

//@ts-ignore
export class IobrokerWebuiBindingsEditor extends BindingsEditor {
    static readonly is = 'iobroker-webui-bindings-editor';
    objectValueType: string;

    constructor(property: IProperty, binding: IBinding & { converter: Record<string, any> }, bindingTarget: BindingTarget, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, shell: VisualizationShell, objectValueType?: string) {
        super(property, binding, bindingTarget, serviceContainer, instanceServiceContainer, shell, { namedConverters: false });

        this.objectValueType = objectValueType ?? '';

        const typeRow = document.createElement('div');
        typeRow.className = 'row';
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'type :';
        typeLabel.title = 'If set, the value is converted to this type before the binding is applied';
        typeLabel.style.cssText = 'white-space: nowrap; margin-right: 4px;';
        const typeSelect = document.createElement('select');
        for (const [value, label] of [['', 'ignore'], ['number', 'number'], ['boolean', 'boolean'], ['string', 'string']]) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            typeSelect.appendChild(option);
        }
        typeSelect.value = this.objectValueType;
        typeSelect.onchange = () => this.objectValueType = typeSelect.value;
        typeRow.append(typeLabel, typeSelect);
        this._getDomElement<HTMLDivElement>('groupinvert').before(typeRow);

        let groupObjectNameControl = this._getDomElement<HTMLButtonElement>('addSignalBtn');
        let btn = document.createElement('button');
        btn.className = 'add-signal-btn';
        btn.textContent = '+ Add ioBroker signal';
        btn.title = "iobroker signal selector";
        btn.onclick = async () => {
            var res = await openSelectIdDialog({ host: window.iobrokerHost, port: window.iobrokerPort, protocol: window.location.protocol, language: 'en', selected: '', allowAll: true })
            if (res) {
                let signalInput = Array.from(this.shadowRoot.querySelectorAll<HTMLInputElement>('.signal-path-input')).find(input => !input.value);
                if (!signalInput) {
                    this._addSignal();
                    signalInput = Array.from(this.shadowRoot.querySelectorAll<HTMLInputElement>('.signal-path-input')).at(-1);
                }
                if (signalInput) {
                    signalInput.value = res;
                    signalInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
        groupObjectNameControl.after(btn);
    }
}
customElements.define(IobrokerWebuiBindingsEditor.is, IobrokerWebuiBindingsEditor)
