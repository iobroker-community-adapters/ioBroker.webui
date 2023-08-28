import { BaseCustomWebComponentLazyAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { PropertiesHelper } from "@node-projects/web-component-designer";
import { IControl } from "../interfaces/IControl.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";

export class BaseCustomControl extends BaseCustomWebComponentLazyAppend {
    static readonly style = css`:host { overflow: hidden }`;

    constructor() {
        super();
    }

    ready(){
        this._parseAttributesToProperties();
        ScriptSystem.assignAllScripts(this.shadowRoot, this);
        //todo: relative bindings
        IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot, '', this);
        this._bindingsParse(null, true);
    }
}

export function generateCustomControl(name: string, control: IControl) {
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
    } else {
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

            return instance;
        }
        window['IobrokerWebuiCustomControl' + name]._template = template;
        window['IobrokerWebuiCustomControl' + name]._style = style;
        window['IobrokerWebuiCustomControl' + name]._properties = properties;
        window['IobrokerWebuiCustomControl' + name].prototype = Object.create(BaseCustomControl.prototype)
        customElements.define('iobroker-webui-custom-control' + nm, window['IobrokerWebuiCustomControl' + name]);
    }
}