import { BaseCustomWebComponentLazyAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { PropertiesHelper } from "@node-projects/web-component-designer";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
export class BaseCustomControl extends BaseCustomWebComponentLazyAppend {
    constructor() {
        super();
        this._parseAttributesToProperties();
        this._bindingsParse(null, true);
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
        else if (val == 'boolean')
            properties[p] = Boolean;
        else if (val == 'number')
            properties[p] = Number;
    }
    if (window['IobrokerWebuiCustomControl' + name]) {
        window['IobrokerWebuiCustomControl' + name]._template = template;
        window['IobrokerWebuiCustomControl' + name]._style = style;
        window['IobrokerWebuiCustomControl' + name]._properties = properties;
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
            let instance = Reflect.construct(BaseCustomControl, [], window['IobrokerWebuiCustomControl' + name]);
            for (let p in control.properties) {
                Object.defineProperty(instance, p, {
                    get() {
                        return this['_' + p];
                    },
                    set(newValue) {
                        this['_' + p] = newValue;
                        this._bindingsRefresh(p);
                    },
                    enumerable: true,
                    configurable: true,
                });
            }
            //@ts-ignore - todo: maybe do it in another way? _rootDocumentFragment is not accessible normaly?
            ScriptSystem.assignAllScripts(instance._rootDocumentFragment, instance);
            return instance;
        };
        window['IobrokerWebuiCustomControl' + name]._template = template;
        window['IobrokerWebuiCustomControl' + name]._style = style;
        window['IobrokerWebuiCustomControl' + name]._properties = properties;
        window['IobrokerWebuiCustomControl' + name].prototype = Object.create(BaseCustomControl.prototype);
        customElements.define('iobroker-webui-custom-control' + nm, window['IobrokerWebuiCustomControl' + name]);
    }
}
