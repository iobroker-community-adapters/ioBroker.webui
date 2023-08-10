var SvgImage_1;
import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, customElement, html, property } from "@node-projects/base-custom-webcomponent";
export let SvgImage = class SvgImage extends BaseCustomWebComponentConstructorAppend {
    static { SvgImage_1 = this; }
    static style = css `
        :host {
            display: block;
            height: 100%;
            width: 100%;
            fill: var(--primary-color, white);
            stroke: var(--primary-color, white);
            color: white;
            font-familiy: Roboto;
            font-size: 14px;
        }
        #container {
            display: flex;
            flex-direction: column;
            justify-items: center;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        #main {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        svg {
            height: 32px;
            width: 32px;
        }
        #foot {
            color: var(--primary-color, white);
            overflow: hidden;
        }
    `;
    static template = html `
    <div id="container">
        <div id="head"></div>
        <div id="main"></div>
        <div id="foot"></div>
        </div>
    `;
    static is = 'iobroker-webui-svg-image';
    _head;
    _main;
    _foot;
    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._head = this._getDomElement('head');
        this._main = this._getDomElement('main');
        this._foot = this._getDomElement('foot');
    }
    ready() {
        this._parseAttributesToProperties();
    }
    _src;
    get src() {
        return this._src;
    }
    set src(value) {
        this._src = value;
        fetch(value).then(async (x) => {
            this._main.innerHTML = await x.text();
        });
    }
    _bgImageSrc;
    get bgImageSrc() {
        return this._bgImageSrc;
    }
    set bgImageSrc(value) {
        this._bgImageSrc = value;
        fetch(value).then(async (x) => {
            //this._main.innerHTML = await x.text();
        });
    }
    _value;
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this._foot.innerText = value ?? '';
    }
    _name;
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
        this._head.innerText = value ?? '';
    }
};
__decorate([
    property(String)
], SvgImage.prototype, "src", null);
__decorate([
    property(String)
], SvgImage.prototype, "bgImageSrc", null);
__decorate([
    property(String)
], SvgImage.prototype, "value", null);
__decorate([
    property(String)
], SvgImage.prototype, "name", null);
SvgImage = SvgImage_1 = __decorate([
    customElement(SvgImage_1.is)
], SvgImage);
