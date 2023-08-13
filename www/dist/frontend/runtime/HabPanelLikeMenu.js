import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, customElement, property } from "@node-projects/base-custom-webcomponent";
export let HabPanelLikeMenu = class HabPanelLikeMenu extends BaseCustomWebComponentConstructorAppend {
    static style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
    }
    `;
    screens;
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._parseAttributesToProperties();
    }
};
__decorate([
    property(Array)
], HabPanelLikeMenu.prototype, "screens", void 0);
HabPanelLikeMenu = __decorate([
    customElement("iobroker-webui-hab-panel-likemenu")
], HabPanelLikeMenu);
