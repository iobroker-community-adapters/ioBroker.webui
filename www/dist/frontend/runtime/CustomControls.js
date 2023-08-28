import { BaseCustomWebComponentConstructorAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { PropertiesHelper } from "@node-projects/web-component-designer";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
export class BaseCustomControl extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._bindingsParse(null, true);
    }
    connectedCallback() {
        this._parseAttributesToProperties();
        this._bindingsRefresh();
        ScriptSystem.assignAllScripts(this.shadowRoot, this);
        IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot, this._getRelativeSignalsPath(), this);
    }
    _getRelativeSignalsPath() {
        return this.getRootNode()?.host?._getRelativeSignalsPath?.() ?? '';
    }
}
BaseCustomControl.style = css `:host { overflow: hidden }`;
export function generateCustomControl(name, control) {
    let nm = PropertiesHelper.camelToDashCase(name);
    if (nm[0] !== '-')
        nm = '-' + nm;
    let template = document.createElement('template');
    template.innerHTML = control.html;
    let style = cssFromString(control.style);
    let properties = {};
    for (let p in control.properties) {
        const val = control.properties[p];
        if (val == 'string')
            properties[p] = String;
        else if (val == 'color')
            properties[p] = String;
        else if (val == 'boolean')
            properties[p] = Boolean;
        else if (val == 'number')
            properties[p] = Number;
        else if (val == 'date')
            properties[p] = Date;
        else if (val.startsWith("[")) // enum
            properties[p] = String;
        else
            properties[p] = Object;
    }
    if (window['IobrokerWebuiCustomControl' + name]) {
        window['IobrokerWebuiCustomControl' + name].template = template;
        window['IobrokerWebuiCustomControl' + name].style = style;
        window['IobrokerWebuiCustomControl' + name].properties = properties;
        window['IobrokerWebuiCustomControl' + name]._control = control;
    }
    else {
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
            }
            return instance;
        };
        window['IobrokerWebuiCustomControl' + name].template = template;
        window['IobrokerWebuiCustomControl' + name].style = style;
        window['IobrokerWebuiCustomControl' + name].properties = properties;
        window['IobrokerWebuiCustomControl' + name]._control = control;
        window['IobrokerWebuiCustomControl' + name].prototype = Object.create(BaseCustomControl.prototype, { constructor: { value: window['IobrokerWebuiCustomControl' + name] } });
        customElements.define('iobroker-webui-custom-control' + nm, window['IobrokerWebuiCustomControl' + name]);
    }
}
