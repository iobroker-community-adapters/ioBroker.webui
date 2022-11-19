import { __decorate } from '/webui/node_modules/tslib/tslib.es6.js';
import { BaseCustomWebComponentConstructorAppend, css, html, property } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
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
    static is = 'iobroker-webui-svg-image';
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
