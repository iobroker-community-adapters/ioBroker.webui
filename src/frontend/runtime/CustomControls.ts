import { BaseCustomWebComponentConstructorAppend, css, cssFromString } from "@node-projects/base-custom-webcomponent";
import { PropertiesHelper } from "@node-projects/web-component-designer";
import { IControl } from "../interfaces/IControl.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";

export class BaseCustomControl extends BaseCustomWebComponentConstructorAppend {
    static readonly style = css`:host { overflow: hidden }`;

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

    _getRelativeSignalsPath(): string {
        return (<any>(<ShadowRoot>this.getRootNode())?.host)?._getRelativeSignalsPath?.() ?? '';
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
        const prp = control.properties[p];
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
        else
            properties[p] = Object;
    }

    if (window['IobrokerWebuiCustomControl' + name]) {
        window['IobrokerWebuiCustomControl' + name].template = template;
        window['IobrokerWebuiCustomControl' + name].style = style;
        window['IobrokerWebuiCustomControl' + name].properties = properties;
        window['IobrokerWebuiCustomControl' + name]._control = control;
        window['IobrokerWebuiCustomControl' + name]._propertiesDictionary = null;
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
        window['IobrokerWebuiCustomControl' + name].template = template;
        window['IobrokerWebuiCustomControl' + name].style = style;
        window['IobrokerWebuiCustomControl' + name].properties = properties;
        window['IobrokerWebuiCustomControl' + name]._control = control;
        window['IobrokerWebuiCustomControl' + name]._propertiesDictionary = null;
        window['IobrokerWebuiCustomControl' + name].prototype = Object.create(BaseCustomControl.prototype, { constructor: { value: window['IobrokerWebuiCustomControl' + name] } })
        customElements.define('iobroker-webui-custom-control' + nm, window['IobrokerWebuiCustomControl' + name]);
    }
}