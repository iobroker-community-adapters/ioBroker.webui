import { pickSignalForInput } from "../helper/SignalPickerHelper.js";
import { css } from "@node-projects/base-custom-webcomponent";
import { BindingsEditor } from "@node-projects/web-component-designer-visualization-addons";
//@ts-ignore
import { openSelectIdDialog } from "@iobroker/webcomponent-selectid-dialog/build/selectIdHelper.js";
const signalActionStyle = css `
    .signal-actions { display:flex; flex-wrap:wrap; gap:6px; padding-top:6px; }
    .signal-actions .add-signal-btn {
        margin:0; height:auto; min-height:26px; padding:4px 8px;
        border:1px solid var(--webui-input-border); border-radius:4px;
        color:var(--webui-text); background:var(--webui-surface);
        font:12px/1.25 system-ui,sans-serif;
    }
    .signal-actions .add-signal-btn:hover { background:var(--webui-hover); }
    .signal-actions .add-signal-btn:active { background:var(--webui-pressed); }
    .signal-select-btn, .signal-icon-btn {
        border:1px solid var(--webui-input-border); border-radius:3px;
        color:var(--webui-text); background:var(--webui-surface);
    }
    .signal-select-btn:hover, .signal-icon-btn:hover { background:var(--webui-hover); }
    .iobroker-signal-btn { flex:0 0 36px; width:36px; }
    .signal-picker-error { color:var(--webui-text); font-size:12px; margin:6px 0; }
    .signal-actions .add-signal-btn:focus-visible { outline:2px solid var(--webui-accent); outline-offset:1px; }
`;
export class IobrokerWebuiBindingsEditor extends BindingsEditor {
    static is = 'iobroker-webui-bindings-editor';
    objectValueType;
    signalRowsObserver = new MutationObserver(() => this.addIobrokerRowButtons());
    constructor(property, binding, bindingTarget, serviceContainer, instanceServiceContainer, shell, objectValueType) {
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
        this._getDomElement('groupinvert').before(typeRow);
        let groupObjectNameControl = this._getDomElement('addSignalBtn');
        let btn = document.createElement('button');
        btn.className = 'add-signal-btn';
        btn.textContent = '+ Add ioBroker signal';
        btn.title = "iobroker signal selector";
        btn.onclick = async () => {
            var res = await openSelectIdDialog({ host: window.iobrokerHost, port: window.iobrokerPort, protocol: window.location.protocol, language: 'en', selected: '', allowAll: true });
            if (res) {
                let signalInput = Array.from(this.shadowRoot.querySelectorAll('.signal-path-input')).find(input => !input.value);
                if (!signalInput) {
                    this._addSignal();
                    signalInput = Array.from(this.shadowRoot.querySelectorAll('.signal-path-input')).at(-1);
                }
                if (signalInput) {
                    signalInput.value = res;
                    signalInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        };
        const actions = document.createElement('div');
        actions.className = 'signal-actions';
        groupObjectNameControl.before(actions);
        actions.append(groupObjectNameControl, btn);
        this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, signalActionStyle];
    }
    ready() {
        super.ready();
        this.addIobrokerRowButtons();
        // The designer rebuilds rows on Add/Duplicate/Remove. Its render method
        // is private, so augment the resulting rows without replacing it.
        this.signalRowsObserver.observe(this._getDomElement('signalListContainer'), { childList: true });
    }
    disconnectedCallback() { this.signalRowsObserver.disconnect(); }
    addIobrokerRowButtons() {
        for (const [index, row] of Array.from(this.shadowRoot.querySelectorAll('#signalListContainer .signal-row')).entries()) {
            if (row.querySelector('.iobroker-signal-btn'))
                continue;
            const input = row.querySelector('.signal-path-input');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'signal-select-btn iobroker-signal-btn';
            button.textContent = 'IOB';
            button.title = 'Browse ioBroker signals';
            button.ariaLabel = `Browse ioBroker signal for row ${index + 1}`;
            button.onclick = async () => {
                button.disabled = true;
                this.shadowRoot.querySelector('.signal-picker-error')?.remove();
                try {
                    await pickSignalForInput(input, selected => openSelectIdDialog({ host: window.iobrokerHost, port: window.iobrokerPort, protocol: location.protocol, language: 'en', selected, allowAll: true }));
                }
                catch (error) {
                    const message = document.createElement('p');
                    message.className = 'signal-picker-error';
                    message.setAttribute('role', 'alert');
                    message.textContent = `Could not open the ioBroker signal selector: ${String(error)}`;
                    this._getDomElement('signalListContainer').after(message);
                }
                finally {
                    button.disabled = false;
                }
            };
            row.querySelector('.signal-select-btn').after(button);
        }
    }
}
customElements.define(IobrokerWebuiBindingsEditor.is, IobrokerWebuiBindingsEditor);
