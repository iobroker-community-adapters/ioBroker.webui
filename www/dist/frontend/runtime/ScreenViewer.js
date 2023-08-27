var ScreenViewer_1;
import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, DomHelper, htmlFromString, property } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
let ScreenViewer = ScreenViewer_1 = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
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
    }
    removeBindings() {
        if (this._iobBindings)
            this._iobBindings.forEach(x => x());
        this._iobBindings = null;
    }
    async _loadScreen() {
        if (!this._loading) {
            this._loading = true;
            await iobrokerHandler.waitForReady();
            this._loading = false;
            this.removeBindings();
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
        this._iobBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot, this.relativeSignalsPath);
        ScreenViewer_1.assignAllScripts(this.shadowRoot, this);
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
    static async assignAllScripts(shadowRoot, instance) {
        const allElements = shadowRoot.querySelectorAll('*');
        const scriptTag = shadowRoot.querySelector('script[type=module]');
        let jsObject = null;
        if (scriptTag) {
            try {
                const scriptUrl = URL.createObjectURL(new Blob([scriptTag.textContent], { type: 'application/javascript' }));
                //@ts-ignore
                jsObject = await importShim(scriptUrl);
                if (jsObject.init) {
                    jsObject.init(instance);
                }
            }
            catch (err) {
                console.warn('error parsing javascript', err);
            }
        }
        for (let e of allElements) {
            for (let a of e.attributes) {
                if (a.name[0] == '@') {
                    try {
                        let evtName = a.name.substring(1);
                        let script = a.value.trim();
                        if (script[0] == '{') {
                            let scriptObj = JSON.parse(script);
                            e.addEventListener(evtName, (evt) => ScriptSystem.execute(scriptObj.commands, { event: evt, element: e }));
                        }
                        else {
                            e.addEventListener(evtName, (evt) => {
                                if (!jsObject[script])
                                    console.warn('javascritp function named: ' + script + ' not found, maybe missing a "export" ?');
                                else
                                    jsObject[script](evt, e, shadowRoot);
                            });
                        }
                    }
                    catch (err) {
                        console.warn('error assigning script', e, a);
                    }
                }
            }
        }
    }
};
ScreenViewer.style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
    }

    *[node-projects-hide-at-run-time] {
        display: none !important;
    }
    `;
__decorate([
    property()
], ScreenViewer.prototype, "screenName", null);
__decorate([
    property()
], ScreenViewer.prototype, "relativeSignalsPath", null);
ScreenViewer = ScreenViewer_1 = __decorate([
    customElement("iobroker-webui-screen-viewer")
], ScreenViewer);
export { ScreenViewer };
