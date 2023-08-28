import { BaseCustomWebComponentLazyAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { PropertiesHelper } from "@node-projects/web-component-designer";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
export class BaseCustomControl extends BaseCustomWebComponentLazyAppend {
    constructor() {
        super();
    }
    ready() {
        this._parseAttributesToProperties();
        let root = this.shadowRoot.children.length > 1 ? this.shadowRoot : this._rootDocumentFragment;
        ScriptSystem.assignAllScripts(root, this);
        this._bindingsParse(null, true);
    }
    connectedCallback() {
        let root = this.shadowRoot.children.length > 1 ? this.shadowRoot : this._rootDocumentFragment;
        IobrokerWebuiBindingsHelper.applyAllBindings(root, this._getRelativeSignalsPath(), this);
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
        window['IobrokerWebuiCustomControl' + name]._template = template;
        window['IobrokerWebuiCustomControl' + name]._style = style;
        window['IobrokerWebuiCustomControl' + name]._properties = properties;
        window['IobrokerWebuiCustomControl' + name]._control = control;
    }
    else {
        window['IobrokerWebuiCustomControl' + name] = function () {
            //@ts-ignore
            this.constructor.template = window['IobrokerWebuiCustomControl' + name]._template;
            //@ts-ignore
            this.constructor.style = window['IobrokerWebuiCustomControl' + name]._style;
            //@ts-ignore
            this.constructor.properties = window['IobrokerWebuiCustomControl' + name]._properties;
            //@ts-ignore
            this.constructor._control = window['IobrokerWebuiCustomControl' + name]._control;
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
        window['IobrokerWebuiCustomControl' + name]._template = template;
        window['IobrokerWebuiCustomControl' + name]._style = style;
        window['IobrokerWebuiCustomControl' + name]._properties = properties;
        window['IobrokerWebuiCustomControl' + name]._control = control;
        window['IobrokerWebuiCustomControl' + name].prototype = Object.create(BaseCustomControl.prototype);
        customElements.define('iobroker-webui-custom-control' + nm, window['IobrokerWebuiCustomControl' + name]);
    }
}
