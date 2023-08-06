import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, cssFromString, customElement, DomHelper, htmlFromString, property } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import { iobrokerHandler } from "../IobrokerHandler.js";
export let ScreenViewer = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    _iobBindings;
    _screenName;
    get screenName() {
        return this._screenName;
    }
    set screenName(value) {
        if (this._screenName != value) {
            this._screenName = value;
            this._loadScreen();
        }
    }
    _relativeSignalsPath;
    get relativeSignalsPath() {
        return this._relativeSignalsPath;
    }
    set relativeSignalsPath(value) {
        if (this._relativeSignalsPath != value) {
            this._relativeSignalsPath = value;
        }
    }
    objects;
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._parseAttributesToProperties();
        iobrokerHandler.screensChanged.on(() => this._loadScreen());
        if (this._screenName)
            this._loadScreen();
        /*
        const target = {};
        const proxyHandler = {
            get: (target, prop, receiver) => {
                return this.state(prop);
            },
            set: (obj, prop, value) => {
                this.set(prop, value);
                return true;
            }
        };

        this.objects = new Proxy(target, proxyHandler);
        */
    }
    async _loadScreen() {
        await iobrokerHandler.connection.waitForFirstConnection();
        if (this._iobBindings)
            this._iobBindings.forEach(x => x());
        this._iobBindings = null;
        DomHelper.removeAllChildnodes(this.shadowRoot);
        const screen = await iobrokerHandler.getScreen(this.screenName);
        if (screen) {
            this.loadScreenData(screen.html, screen.style);
        }
    }
    loadScreenData(html, style) {
        if (style)
            this.shadowRoot.adoptedStyleSheets = [cssFromString(style)];
        else
            this.shadowRoot.adoptedStyleSheets = [];
        const template = htmlFromString(html);
        const documentFragment = template.content.cloneNode(true);
        //this._bindingsParse(documentFragment, true);
        this.shadowRoot.appendChild(documentFragment);
        this._iobBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot);
    }
};
__decorate([
    property()
], ScreenViewer.prototype, "screenName", null);
__decorate([
    property()
], ScreenViewer.prototype, "relativeSignalsPath", null);
ScreenViewer = __decorate([
    customElement("iobroker-webui-screen-viewer")
], ScreenViewer);
