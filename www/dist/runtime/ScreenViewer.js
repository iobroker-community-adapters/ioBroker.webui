import { __decorate } from '/webui/node_modules/tslib/tslib.es6.js';
import { BaseCustomWebComponentConstructorAppend, customElement, DomHelper, htmlFromString, property } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { IobrokerWebuiBindingsHelper } from '../helper/IobrokerWebuiBindingsHelper.js';
import { iobrokerHandler } from '../IobrokerHandler.js';
let ScreenViewer = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
    }
    get screenName() {
        return this._screenName;
    }
    set screenName(value) {
        if (this._screenName != value) {
            this._screenName = value;
            this._loadScreen();
        }
    }
    get relativeSignalsPath() {
        return this._relativeSignalsPath;
    }
    set relativeSignalsPath(value) {
        if (this._relativeSignalsPath != value) {
            this._relativeSignalsPath = value;
        }
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
        if (this._iobBindings)
            this._iobBindings.forEach(x => x());
        this._iobBindings = null;
        DomHelper.removeAllChildnodes(this.shadowRoot);
        await iobrokerHandler.connection.waitForFirstConnection();
        const screen = iobrokerHandler.getScreen(this.screenName);
        if (screen) {
            this.loadScreenData(screen.html);
        }
    }
    loadScreenData(html) {
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
export { ScreenViewer };
