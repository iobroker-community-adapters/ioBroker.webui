import { BaseCustomWebComponentConstructorAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { PropertiesHelper } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/PropertiesHelper.js";
export const webuiCustomControlPrefix = 'webui-';
export const webuiCustomControlSymbol = Symbol('webuiCustomControlSymbol');
export class BaseCustomControl extends BaseCustomWebComponentConstructorAppend {
    static style = css `:host { overflow: hidden }`;
    #scriptObject;
    #bindings;
    #eventListeners = [];
    #resizeObserver;
    #specialValueHandler;
    #controlChangedSubscription;
    constructor() {
        super();
        this._bindingsParse(null, true);
        if (this.constructor[webuiCustomControlSymbol].control.settings.useGlobalStyle)
            this.shadowRoot.adoptedStyleSheets = [iobrokerHandler.globalStylesheet, ...this.shadowRoot.adoptedStyleSheets];
        if (this.constructor[webuiCustomControlSymbol].control.settings.bindToSize) {
            this.#resizeObserver = new ResizeObserver((entries) => {
                let cbs = this.#specialValueHandler.valueChangedCallbacks.get('width');
                if (cbs) {
                    for (const c of cbs)
                        c();
                }
                cbs = this.#specialValueHandler.valueChangedCallbacks.get('height');
                if (cbs) {
                    for (const c of cbs)
                        c();
                }
            });
        }
    }
    async connectedCallback() {
        this._parseAttributesToProperties();
        this._bindingsRefresh();
        this.#specialValueHandler = {
            valueProvider: (specialValueName) => {
                switch (specialValueName) {
                    case 'width':
                        return this.getBoundingClientRect().width;
                    case 'height':
                        return this.getBoundingClientRect().height;
                }
                return null;
            },
            valueChangedCallbacks: new Map()
        };
        this.#bindings = window.appShell.bindingsHelper.applyAllBindings(this.shadowRoot, this._getRelativeSignalsPath(), this, this.#specialValueHandler);
        this.#scriptObject = await window.appShell.scriptSystem.assignAllScripts('customControl ' + this.constructor[webuiCustomControlSymbol].name, this.constructor[webuiCustomControlSymbol].control.script, this.shadowRoot, this, iobrokerHandler);
        this.#scriptObject?.connectedCallback?.(this, this.shadowRoot);
        for (let e of this.#eventListeners) {
            this.addEventListener(e[0], e[1]);
        }
        this.#resizeObserver?.observe(this);
        this.#controlChangedSubscription = iobrokerHandler.objectsChanged.on(d => {
            const ctlName = this.constructor[webuiCustomControlSymbol].name;
            if (d.type == 'control' && d.name === ctlName) {
                this.disconnectedCallback();
                this._rootDocumentFragment = this.constructor.template.content.cloneNode(true);
                this.shadowRoot.innerHTML = '';
                this.shadowRoot.appendChild(this._rootDocumentFragment);
                this._bindingsParse(null, true);
                this.connectedCallback();
            }
        });
    }
    disconnectedCallback() {
        for (let e of this.#eventListeners) {
            this.removeEventListener(e[0], e[1]);
        }
        this.#scriptObject?.disconnectedCallback?.(this, this.shadowRoot);
        for (const b of this.#bindings)
            b();
        this.#bindings = null;
        this.#resizeObserver?.unobserve(this);
        this.#controlChangedSubscription.dispose();
    }
    _assignEvent(event, callback) {
        const arrayEl = [event, callback];
        this.#eventListeners.push(arrayEl);
        this.addEventListener(event, callback);
        return {
            remove: () => {
                const index = this.#eventListeners.indexOf(arrayEl);
                this.#eventListeners.splice(index, 1);
                this.removeEventListener(event, callback);
            }
        };
    }
    _getRelativeSignalsPath() {
        return this.getRootNode()?.host?._getRelativeSignalsPath?.() ?? '';
    }
}
window.BaseCustomControl = BaseCustomControl;
export function getCustomControlName(name) {
    if (name[0] == '/')
        name = name.substring(1);
    let nm = PropertiesHelper.camelToDashCase(name.replaceAll('/', '-').replaceAll(' ', '-').replaceAll('--', '-'));
    if (nm[0] === '-')
        nm = nm.substring(1);
    return webuiCustomControlPrefix + nm;
}
export function generateCustomControl(name, control) {
    const nm = getCustomControlName(name);
    let template = document.createElement('template');
    template.innerHTML = control.html;
    let style = cssFromString(control.style);
    let properties = {};
    for (let p in control.properties) {
        const prp = control.properties[p];
        if (prp.internal)
            continue;
        if (prp.type == 'string')
            properties[p] = String;
        else if (prp.type == 'color')
            properties[p] = String;
        else if (prp.type == 'boolean')
            properties[p] = Boolean;
        else if (prp.type == 'number')
            properties[p] = Number;
        else if (prp.type == 'date')
            properties[p] = Date;
        else if (prp.type == 'enum') // enum
            properties[p] = String;
        else if (prp.type == 'signal')
            properties[p] = String;
        else if (prp.type == 'screen')
            properties[p] = String;
        else if (prp.type == 'object')
            properties[p] = Object;
        else
            properties[p] = Object;
    }
    if (window['IobrokerWebuiCustomControl' + name]) {
        window['IobrokerWebuiCustomControl' + name].template = template;
        window['IobrokerWebuiCustomControl' + name].style = style;
        window['IobrokerWebuiCustomControl' + name].properties = properties;
        window['IobrokerWebuiCustomControl' + name]._propertiesDictionary = null;
        const ccInfo = window['IobrokerWebuiCustomControl' + name][webuiCustomControlSymbol];
        ccInfo.control = control;
    }
    else {
        window['IobrokerWebuiCustomControl' + name] = function () {
            //@ts-ignore
            let instance = Reflect.construct(BaseCustomControl, [], window['IobrokerWebuiCustomControl' + name]);
            let currControl = window['IobrokerWebuiCustomControl' + name][webuiCustomControlSymbol].control;
            for (let p in currControl.properties) {
                let backup = undefined;
                if (p in instance) {
                    backup = instance[p];
                    delete instance[p];
                }
                Object.defineProperty(instance, p, {
                    get() {
                        return this['_' + p];
                    },
                    set(newValue) {
                        if (this['_' + p] !== newValue && (!Number.isNaN(this['_' + p]) || !Number.isNaN(newValue))) {
                            this['_' + p] = newValue;
                            this._bindingsRefresh(p);
                            instance.dispatchEvent(new CustomEvent(PropertiesHelper.camelToDashCase(p) + '-changed', { detail: { newValue } }));
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
                if (backup !== undefined) {
                    instance[p] = backup;
                }
                else if (currControl.properties[p].default != null) {
                    instance['_' + p] = currControl.properties[p].default;
                }
            }
            return instance;
        };
        let ccInfo = {
            control,
            name
        };
        window['IobrokerWebuiCustomControl' + name][webuiCustomControlSymbol] = ccInfo;
        window['IobrokerWebuiCustomControl' + name].template = template;
        window['IobrokerWebuiCustomControl' + name].style = style;
        window['IobrokerWebuiCustomControl' + name].properties = properties;
        window['IobrokerWebuiCustomControl' + name]._propertiesDictionary = null;
        window['IobrokerWebuiCustomControl' + name].prototype = Object.create(BaseCustomControl.prototype, { constructor: { value: window['IobrokerWebuiCustomControl' + name] } });
        if (!customElements.get(nm))
            customElements.define(nm, window['IobrokerWebuiCustomControl' + name]);
    }
}
