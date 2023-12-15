import { BaseCustomWebComponentConstructorAppend, TypedEvent, css, html } from "@node-projects/base-custom-webcomponent";
export class IobrokerWebuiConfirmationWrapper extends BaseCustomWebComponentConstructorAppend {
    static style = css `
        #upper {
            height: calc(100% - 35px);
            position: relative;
        }
        #lower {
            height: 35px;
            display: grid;
            gap: 5px;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr;
            padding: 5px;
            box-sizing: border-box;
        }`;
    static template = html `
        <div id="upper"><slot></slot></div>
        <div id="lower">
            <button id="ok" @click="_ok">Ok</button>
            <button id="cancel" @click="_cancel">Cancel</button>
        </div>`;
    constructor(additional) {
        super();
        this._restoreCachedInititalValues();
        if (additional?.okText)
            this._getDomElement('ok').textContent = additional.okText;
        if (additional?.cancelText)
            this._getDomElement('cancel').textContent = additional.cancelText;
    }
    ready() {
        this._assignEvents();
    }
    _ok() {
        this.okClicked?.emit();
    }
    _cancel() {
        this.cancelClicked?.emit();
    }
    okClicked = new TypedEvent;
    cancelClicked = new TypedEvent;
}
customElements.define("iobroker-webui-confirmation-wrapper", IobrokerWebuiConfirmationWrapper);
