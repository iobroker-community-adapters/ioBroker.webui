var ScreenViewer_1;
import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, DomHelper, htmlFromString, property } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import { iobrokerHandler } from "../IobrokerHandler.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
export let ScreenViewer = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    static { ScreenViewer_1 = this; }
    static style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
    }
    `;
    _iobBindings;
    _loading;
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
        //Todo: unsubscribe from this event (or it causes memory leaks)
        iobrokerHandler.screensChanged.on(() => {
            if (this._screenName)
                this._loadScreen();
        });
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
        if (!this._loading) {
            this._loading = true;
            await iobrokerHandler.waitForReady();
            this._loading = false;
            if (this._iobBindings)
                this._iobBindings.forEach(x => x());
            this._iobBindings = null;
            DomHelper.removeAllChildnodes(this.shadowRoot);
            const screen = await iobrokerHandler.getScreen(this.screenName);
            if (screen) {
                this.loadScreenData(screen.html, screen.style);
            }
        }
    }
    loadScreenData(html, style) {
        let globalStyle = iobrokerHandler.config?.globalStyle ?? '';
        if (globalStyle && style)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer_1.style, cssFromString(globalStyle), cssFromString(style)];
        else if (globalStyle)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer_1.style, cssFromString(globalStyle)];
        else if (style)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer_1.style, cssFromString(style)];
        else
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer_1.style];
        const template = htmlFromString(html);
        const documentFragment = template.content.cloneNode(true);
        //this._bindingsParse(documentFragment, true);
        this.shadowRoot.appendChild(documentFragment);
        this._iobBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot);
        this.assignAllScripts();
    }
    /*
    _states: { [name: string]: any } = {};
    _subscriptions = new Set<string>();

    state(name: string) {
        if (!this._subscriptions.has(name)) {
            this._subscriptions.add(name);
            this._states[name] = null;
            iobrokerHandler.connection.subscribeState(name, (id, state) => {
                this._states[name] = state.val;
                this._bindingsRefresh();
            })
        }
        return this._states[name];
    }

    set(name: string, value: ioBroker.StateValue) {
        iobrokerHandler.connection.setState(name, value);
    }
    */
    assignAllScripts() {
        const allElements = this.shadowRoot.querySelectorAll('*');
        for (let e of allElements) {
            for (let a of e.attributes) {
                if (a.name[0] == '@') {
                    try {
                        let evtName = a.name.substring(1);
                        let script = JSON.parse(a.value);
                        e.addEventListener(evtName, () => ScriptSystem.execute(script.commands, null));
                    }
                    catch (err) {
                        console.warn('error assigning script', e, a);
                    }
                }
            }
        }
    }
};
__decorate([
    property()
], ScreenViewer.prototype, "screenName", null);
__decorate([
    property()
], ScreenViewer.prototype, "relativeSignalsPath", null);
ScreenViewer = ScreenViewer_1 = __decorate([
    customElement("iobroker-webui-screen-viewer")
], ScreenViewer);
