import { BaseCustomWebComponentConstructorAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { IControl } from "../interfaces/IControl.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { PropertiesHelper } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/PropertiesHelper.js";
import { ICustomControlScript } from "../interfaces/ICustomControlScript.js";

export const webuiCustomControlPrefix = 'webui-';
export const webuiCustomControlSymbol = Symbol('webuiCustomControlSymbol');
export type CustomControlInfo = {
    control: IControl,
    name: string
}

export class BaseCustomControl extends BaseCustomWebComponentConstructorAppend {
    static readonly style = css`:host { overflow: hidden }`;
    #scriptObject: ICustomControlScript;
    #bindings: (() => void)[];
    #eventListeners: [name: string, callback: (...args) => void][] = [];

    constructor() {
        super();
        this._bindingsParse(null, true);
        if ((<IControl>(<CustomControlInfo>(<any>this.constructor)[webuiCustomControlSymbol]).control).settings.useGlobalStyle)
            this.shadowRoot.adoptedStyleSheets = [iobrokerHandler.globalStylesheet, ...this.shadowRoot.adoptedStyleSheets]
    }

    async connectedCallback() {
        this._parseAttributesToProperties();
        this._bindingsRefresh();
        this.#bindings = window.appShell.bindingsHelper.applyAllBindings(this.shadowRoot, this._getRelativeSignalsPath(), this);
        this.#scriptObject = await window.appShell.scriptSystem.assignAllScripts('customControl ' + (<CustomControlInfo>(<any>this.constructor)[webuiCustomControlSymbol]).name, (<IControl>(<CustomControlInfo>(<any>this.constructor)[webuiCustomControlSymbol]).control).script, this.shadowRoot, this, iobrokerHandler);
        this.#scriptObject?.connectedCallback?.(this);
        for (let e of this.#eventListeners) {
            this.addEventListener(e[0], e[1]);
        }
    }

    disconnectedCallback() {
        for (let e of this.#eventListeners) {
            this.removeEventListener(e[0], e[1]);
        }
        this.#scriptObject?.disconnectedCallback?.(this);
        for (const b of this.#bindings)
            b();
        this.#bindings = null;
    }

    _assignEvent(event: string, callback: (...args) => void): { remove: () => void } {
        const arrayEl: [name: string, callback: (...args) => void] = [event, callback];
        this.#eventListeners.push(arrayEl);
        this.addEventListener(event, callback);
        return {
            remove: () => {
                const index = this.#eventListeners.indexOf(arrayEl);
                this.#eventListeners.splice(index, 1);
                this.removeEventListener(event, callback);
            }
        }
    }

    _getRelativeSignalsPath(): string {
        return (<any>(<ShadowRoot>this.getRootNode())?.host)?._getRelativeSignalsPath?.() ?? '';
    }
}

window.BaseCustomControl = BaseCustomControl;

export function getCustomControlName(name: string) {
    if (name[0] == '/')
        name = name.substring(1);
    let nm = PropertiesHelper.camelToDashCase(name.replaceAll('/', '-').replaceAll(' ', '-').replaceAll('--', '-'));
    if (nm[0] === '-')
        nm = nm.substring(1);
    return webuiCustomControlPrefix + nm;
}

export function generateCustomControl(name: string, control: IControl) {
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
        const ccInfo: CustomControlInfo = window['IobrokerWebuiCustomControl' + name][webuiCustomControlSymbol];
        ccInfo.control = control;
    } else {
        window['IobrokerWebuiCustomControl' + name] = function () {
            //@ts-ignore
            let instance = Reflect.construct(BaseCustomControl, [], window['IobrokerWebuiCustomControl' + name]);

            for (let p in control.properties) {
                Object.defineProperty(instance, p, {
                    get() {
                        return this['_' + p];
                    },
                    set(newValue) {
                        if (this['_' + p] !== newValue) {
                            this['_' + p] = newValue;
                            this._bindingsRefresh(p);
                            instance.dispatchEvent(new CustomEvent(PropertiesHelper.camelToDashCase(p) + '-changed', { detail: { newValue } }));
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
                if (control.properties[p].default) {
                    instance['_' + p] = control.properties[p].default;
                }
            }
            return instance;
        }


        let ccInfo: CustomControlInfo = {
            control,
            name
        }

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