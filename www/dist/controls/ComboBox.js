import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, html, property } from "@node-projects/base-custom-webcomponent";
export class ComboBox extends BaseCustomWebComponentConstructorAppend {
    static style = css `
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }
        select {
            height: 100%;
            width: 100%;
        }
    `;
    static template = html `
        <select id="select"></select>
    `;
    static is = 'iobroker-webui-combo-box';
    //@ts-ignore
    _select;
    constructor() {
        super();
        this._select = this._getDomElement('select');
        this._parseAttributesToProperties();
    }
    _items;
    get items() {
        return this._items;
    }
    set items(value) {
        this._items = value;
    }
}
__decorate([
    property(String)
], ComboBox.prototype, "items", null);
customElements.define(ComboBox.is, ComboBox);
