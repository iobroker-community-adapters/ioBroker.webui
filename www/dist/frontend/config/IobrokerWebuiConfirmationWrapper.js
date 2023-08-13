import { BaseCustomWebComponentConstructorAppend, TypedEvent, css, html } from "@node-projects/base-custom-webcomponent";
export class IobrokerWebuiConfirmationWrapper extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this.okClicked = new TypedEvent;
        this.cancelClicked = new TypedEvent;
        this._restoreCachedInititalValues();
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
}
IobrokerWebuiConfirmationWrapper.style = css `
        #upper {
            height: calc(100% - 35px);

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
IobrokerWebuiConfirmationWrapper.template = html `
        <div id="upper"><slot></slot></div>
        <div id="lower">
            <button @click="_ok">Ok</button>
            <button @click="_cancel">Cancel</button>
        </div>`;
customElements.define("iobroker-webui-confirmation-wrapper", IobrokerWebuiConfirmationWrapper);
