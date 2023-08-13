import { BaseCustomWebComponentConstructorAppend, css, customElement, property } from "@node-projects/base-custom-webcomponent";

@customElement("iobroker-webui-hab-panel-likemenu")
export class HabPanelLikeMenu extends BaseCustomWebComponentConstructorAppend {

    static style = css`
    :host {
        height: 100%;
        position: relative;
        display: block;
    }
    `

    @property(Array)
    screens: string[]

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    ready() {
        this._parseAttributesToProperties();
        
    }
}
