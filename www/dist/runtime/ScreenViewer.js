var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseCustomWebComponentConstructorAppend, customElement, DomHelper, htmlFromString, property } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { IobrokerWebuiBindingsHelper } from '../helper/IobrokerWebuiBindingsHelper.js';
import { iobrokerHandler } from '../IobrokerHandler.js';
let ScreenViewer = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._states = {};
        this._subscriptions = new Set();
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
    get relativeStatesPath() {
        return this._relativeStatesPath;
    }
    set relativeStatesPath(value) {
        if (this._relativeStatesPath != value) {
            this._relativeStatesPath = value;
        }
    }
    ready() {
        this._parseAttributesToProperties();
        iobrokerHandler.screensChanged.on(() => this._loadScreen());
        this._loadScreen();
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
        IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot);
    }
    _loadScreen() {
        DomHelper.removeAllChildnodes(this.shadowRoot);
        const screen = iobrokerHandler.getScreen(this.screenName);
        if (screen) {
            const template = htmlFromString(screen.html);
            const documentFragment = template.content.cloneNode(true);
            //this._bindingsParse(documentFragment, true);
            this.shadowRoot.appendChild(documentFragment);
        }
    }
    state(name) {
        if (!this._subscriptions.has(name)) {
            this._subscriptions.add(name);
            this._states[name] = null;
            iobrokerHandler.connection.subscribeState(name, (id, state) => {
                this._states[name] = state.val;
                this._bindingsRefresh();
            });
        }
        return this._states[name];
    }
    set(name, value) {
        iobrokerHandler.connection.setState(name, value);
    }
};
__decorate([
    property()
], ScreenViewer.prototype, "screenName", null);
__decorate([
    property()
], ScreenViewer.prototype, "relativeStatesPath", null);
ScreenViewer = __decorate([
    customElement("iobroker-webui-screen-viewer")
], ScreenViewer);
export { ScreenViewer };
