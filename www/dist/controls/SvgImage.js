import { __decorate } from '/webui/node_modules/tslib/tslib.es6.js';
import { BaseCustomWebComponentConstructorAppend, css, property } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
export class SvgImage extends BaseCustomWebComponentConstructorAppend {
    static style = css `
        :host {
            display: block;
            height: 100%;
            width: 100%;
            fill: black;
            stroke: black;
        }
        svg {
            height: 100%;
            width: 100%;
        }
    `;
    static is = 'iobroker-webui-svg-image';
    constructor() {
        super();
        this._parseAttributesToProperties();
    }
    _src;
    get src() {
        return this._src;
    }
    set src(value) {
        this._src = value;
        fetch(value).then(async (x) => {
            this.shadowRoot.innerHTML = await x.text();
        });
    }
}
__decorate([
    property(String)
], SvgImage.prototype, "src", null);
customElements.define(SvgImage.is, SvgImage);
