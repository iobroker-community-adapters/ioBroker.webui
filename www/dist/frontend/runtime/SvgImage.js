import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, customElement, html, property } from "@node-projects/base-custom-webcomponent";
let SvgImage = class SvgImage extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._head = this._getDomElement('head');
        this._main = this._getDomElement('main');
        this._foot = this._getDomElement('foot');
        this.src = this.src;
        this.bgImageSrc = this.bgImageSrc;
        this.name = this.name;
        this.value = this.value;
    }
    ready() {
        this._parseAttributesToProperties();
    }
    get src() {
        return this._src;
    }
    set src(value) {
        this._src = value;
        if (this._main) {
            if (value) {
                fetch(value).then(async (x) => {
                    this._main.innerHTML = await x.text();
                });
            }
            else {
                this._main.innerHTML = '';
            }
        }
    }
    get bgImageSrc() {
        return this._bgImageSrc;
    }
    set bgImageSrc(value) {
        this._bgImageSrc = value;
        if (value) {
            fetch(value).then(async (x) => {
                //this._main.innerHTML = await x.text();
            });
        }
        else {
            //this._main.innerHTML = '';
        }
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        if (this._foot)
            this._foot.innerText = value ?? '';
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
        if (this._head)
            this._head.innerText = value ?? '';
    }
};
SvgImage.style = css `
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
        #head {
            text-align: center;
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
            text-align: center;
        }`;
SvgImage.template = html `
    <div id="container">
        <div id="head"></div>
        <div id="main"></div>
        <div id="foot"></div>
    </div>`;
SvgImage.is = 'iobroker-webui-svg-image';
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
SvgImage = __decorate([
    customElement(SvgImage.is)
], SvgImage);
export { SvgImage };
