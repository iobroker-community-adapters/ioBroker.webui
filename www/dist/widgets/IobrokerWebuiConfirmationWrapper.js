import { BaseCustomWebComponentConstructorAppend, TypedEvent, css, html } from "@node-projects/base-custom-webcomponent";
export class IobrokerWebuiConfirmationWrapper extends BaseCustomWebComponentConstructorAppend {
    static style = css `
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
    static template = html `
        <div id="upper"><slot></slot></div>
        <div id="lower">
            <button @click="_ok">Ok</button>
            <button @click="_cancel">Cancel</button>
        </div>`;
    constructor() {
        super();
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
    okClicked = new TypedEvent;
    cancelClicked = new TypedEvent;
}
customElements.define("iobroker-webui-confirmation-wrapper", IobrokerWebuiConfirmationWrapper);
