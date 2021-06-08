import { BaseCustomWebComponentConstructorAppend, customElement, property } from "@node-projects/base-custom-webcomponent";
import { screensPrefix } from "../Constants";
import Connection from '../SetupConnection';
import { BindingHelper } from './BindingHelper';

@customElement("web-ui-display-view")
export class WebUiDisplayView extends BaseCustomWebComponentConstructorAppend {

    constructor() {
        super();

        this._parseAttributesToProperties();
        this._viewChanged();
    }

    private _view: string;
    private _bindingHelpers: BindingHelper[] = [];

    @property(String)
    get view() {
        return this._view;
    }
    set view(value: string) {
        this._view = value;
        this._viewChanged();
    }

    async _viewChanged() {
        const obj = await Connection.getObject(screensPrefix + this.view);
        if (obj) {
            this.shadowRoot.innerHTML = obj.native.html;
            const bindings = JSON.parse(obj.native.bindings);
            for (let b of bindings) {
                this._bindingHelpers.push(new BindingHelper(b));
            }
        }
    }
}