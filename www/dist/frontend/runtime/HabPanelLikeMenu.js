import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, customElement, property } from "@node-projects/base-custom-webcomponent";
export let HabPanelLikeMenu = class HabPanelLikeMenu extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._parseAttributesToProperties();
    }
};
HabPanelLikeMenu.style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
    }
    `;
__decorate([
    property(Array)
], HabPanelLikeMenu.prototype, "screens", void 0);
HabPanelLikeMenu = __decorate([
    customElement("iobroker-webui-hab-panel-likemenu")
], HabPanelLikeMenu);
