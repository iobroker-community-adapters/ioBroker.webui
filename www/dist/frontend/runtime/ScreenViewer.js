var ScreenViewer_1;
import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, DomHelper, html, property } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { convertCssUnitToPixel } from "@node-projects/web-component-designer/dist/elements/helper/CssUnitConverter.js";
import { isFirefox } from "@node-projects/web-component-designer/dist/elements/helper/Browser.js";
import { PropertiesHelper } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/PropertiesHelper.js";
let ScreenViewer = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    static { ScreenViewer_1 = this; }
    static style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
    }

    *[node-projects-hide-at-run-time] {
        display: none !important;
    }`;
    static template = html `<div id="root"></div>`;
    _iobBindings;
    _loading;
    _refreshViewSubscription;
    _screensChangedSubscription;
    _scriptObject;
    _resizeObserver;
    _root;
    _rootShadow;
    #eventListeners = [];
    _stretch;
    get stretch() {
        return this._stretch;
    }
    set stretch(value) {
        if (this._stretch != value) {
            this._stretch = value;
            this._loadScreen();
        }
    }
    _stretchWidth;
    get stretchWidth() {
        return this._stretchWidth;
    }
    set stretchWidth(value) {
        if (this._stretchWidth != value) {
            this._stretchWidth = value;
            this._loadScreen();
        }
    }
    _stretchHeight;
    get stretchHeight() {
        return this._stretchHeight;
    }
    set stretchHeight(value) {
        if (this._stretchHeight != value) {
            this._stretchHeight = value;
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
    async setScreenNameAndLoad(screen) {
        if (this._screenName != screen) {
            this._screenName = screen;
            await this._loadScreen();
        }
    }
    objects;
    _useStyleFromScreenForViewer;
    get useStyleFromScreenForViewer() {
        return this._useStyleFromScreenForViewer;
    }
    set useStyleFromScreenForViewer(value) {
        if (this._useStyleFromScreenForViewer != value) {
            this._useStyleFromScreenForViewer = value;
            this._loadScreen();
        }
    }
    constructor() {
        super();
        this._root = super._getDomElement('root');
        this._rootShadow = this._root.attachShadow({ mode: 'open' });
        this._restoreCachedInititalValues();
    }
    _getDomElement(id) {
        return this._rootShadow.getElementById(id);
    }
    _getDomElements(selectors) {
        return this._rootShadow.querySelectorAll(selectors);
    }
    ready() {
        this._parseAttributesToProperties();
        if (this._screenName)
            this._loadScreen();
    }
    removeBindings() {
        if (this._iobBindings)
            this._iobBindings.forEach(x => x());
        this._iobBindings = null;
    }
    async _loadScreen() {
        if (this.screenName) {
            if (!this._loading) {
                this._loading = true;
                await iobrokerHandler.waitForReady();
                this._loading = false;
                this.removeBindings();
                const screen = await iobrokerHandler.getWebuiObject('screen', this.screenName);
                DomHelper.removeAllChildnodes(this._rootShadow);
                if (screen) {
                    await this.loadScreenData(screen.html, screen.style, screen.script, screen.settings, screen.properties);
                }
            }
        }
    }
    async loadScreenData(html, style, script, settings, properties) {
        if (properties) {
            for (const p in properties) {
                const prp = properties[p];
                Object.defineProperty(this, p, {
                    get() {
                        return this['_' + p];
                    },
                    set(newValue) {
                        if (this['_' + p] !== newValue) {
                            this['_' + p] = newValue;
                            //this._bindingsRefresh(p);
                            this.dispatchEvent(new CustomEvent(PropertiesHelper.camelToDashCase(p) + '-changed', { detail: { newValue } }));
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
                if (prp.default) {
                    this['_' + p] = prp.default;
                }
            }
        }
        let globalStyle = iobrokerHandler.config?.globalStyle ?? '';
        this._stretchView(settings);
        let parsedStyle = null;
        if (style) {
            try {
                const boundCss = await window.appShell.bindingsHelper.parseCssBindings(style, this, this.relativeSignalsPath, this);
                parsedStyle = boundCss[0];
                this._iobBindings = boundCss[1];
            }
            catch (err) {
                console.warn(err);
                parsedStyle = cssFromString(style);
            }
        }
        else {
            this._iobBindings = null;
        }
        if (globalStyle && style)
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style, iobrokerHandler.globalStylesheet, parsedStyle];
        else if (globalStyle)
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style, iobrokerHandler.globalStylesheet];
        else if (style)
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style, parsedStyle];
        else
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style];
        if (this._useStyleFromScreenForViewer) {
            this.shadowRoot.adoptedStyleSheets = this._rootShadow.adoptedStyleSheets;
            this._root.style.setProperty('background', 'transparent', 'important');
            this._root.style.setProperty('border', 'none', 'important');
            this._root.style.setProperty('transform', 'none', 'important');
            this._root.style.setProperty('padding', '0', 'important');
            this._root.style.setProperty('margin', '0', 'important');
            this.style.setProperty('display', 'block', 'important');
        }
        else {
            this.shadowRoot.adoptedStyleSheets = [];
            this._root.style.removeProperty('background');
            this._root.style.removeProperty('border');
            this._root.style.removeProperty('transform');
            this._root.style.removeProperty('padding');
            this._root.style.removeProperty('margin');
            this.style.removeProperty('display');
        }
        let myDocument;
        //@ts-ignore
        if (Document.parseHTMLUnsafe && !isFirefox) {
            //@ts-ignore
            myDocument = Document.parseHTMLUnsafe(html);
        }
        else {
            //@ts-ignore
            myDocument = new DOMParser().parseFromString(html, 'text/html', { includeShadowRoots: true });
        }
        const fragment = document.createDocumentFragment();
        for (const n of myDocument.head.childNodes)
            fragment.appendChild(n);
        for (const n of myDocument.body.childNodes)
            fragment.appendChild(n);
        this._rootShadow.appendChild(fragment);
        const res = window.appShell.bindingsHelper.applyAllBindings(this._rootShadow, this.relativeSignalsPath, this);
        if (this._iobBindings)
            this._iobBindings.push(...res);
        else
            this._iobBindings = res;
        this._scriptObject = await window.appShell.scriptSystem.assignAllScripts('screenviewer - ' + this.screenName, script, this._rootShadow, this, iobrokerHandler);
    }
    _stretchView(settings) {
        const stretch = this.stretch ?? settings?.stretch;
        if (!stretch || stretch === 'none')
            return;
        const width = this._stretchWidth ?? convertCssUnitToPixel(settings.width, this, 'width');
        const height = this._stretchHeight ?? convertCssUnitToPixel(settings.height, this, 'height');
        this._root.style.width = width + 'px';
        this._root.style.height = height + 'px';
        let scaleX = this.offsetWidth / width;
        let scaleY = this.offsetHeight / height;
        let translateX = 0;
        let translateY = 0;
        if (stretch == 'uniform') {
            if (scaleX > scaleY) {
                scaleX = scaleY;
                translateX = (this.offsetWidth - (width * scaleX)) / 2;
            }
            else {
                scaleY = scaleX;
                translateY = (this.offsetHeight - (height * scaleY)) / 2;
            }
        }
        else if (stretch == 'uniformToFill') {
            if (scaleX > scaleY) {
                scaleY = scaleX;
                translateY = (this.offsetHeight - (height * scaleY)) / 2;
            }
            else {
                scaleX = scaleY;
                translateX = (this.offsetWidth - (width * scaleX)) / 2;
            }
        }
        this._root.style.transformOrigin = '0 0';
        this._root.style.scale = scaleX + ' ' + scaleY;
        this._root.style.translate = translateX + 'px ' + translateY + 'px';
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver(() => { this._stretchView(settings); });
            this._resizeObserver.observe(this);
        }
    }
    _getRelativeSignalsPath() {
        return this._relativeSignalsPath;
    }
    connectedCallback() {
        this._refreshViewSubscription = iobrokerHandler.refreshView.on(() => this._loadScreen());
        this._screensChangedSubscription = iobrokerHandler.objectsChanged.on(() => {
            if (this._screenName)
                this._loadScreen();
        });
        this._scriptObject?.connectedCallback?.(this, this._rootShadow);
        for (let e of this.#eventListeners) {
            this.addEventListener(e[0], e[1]);
        }
        if (this._resizeObserver)
            this._resizeObserver.observe(this);
    }
    disconnectedCallback() {
        for (let e of this.#eventListeners) {
            this.removeEventListener(e[0], e[1]);
        }
        this._refreshViewSubscription?.dispose();
        this._screensChangedSubscription?.dispose();
        this._scriptObject?.disconnectedCallback?.(this, this._rootShadow);
        if (this._resizeObserver)
            this._resizeObserver.disconnect();
    }
    _assignEvent(event, callback) {
        const arrayEl = [event, callback];
        this.#eventListeners.push(arrayEl);
        this.addEventListener(event, callback);
        return {
            remove: () => {
                const index = this.#eventListeners.indexOf(arrayEl);
                this.#eventListeners.splice(index, 1);
                this.removeEventListener(event, callback);
            }
        };
    }
};
__decorate([
    property()
], ScreenViewer.prototype, "stretch", null);
__decorate([
    property()
], ScreenViewer.prototype, "stretchWidth", null);
__decorate([
    property()
], ScreenViewer.prototype, "stretchHeight", null);
__decorate([
    property()
], ScreenViewer.prototype, "relativeSignalsPath", null);
__decorate([
    property()
], ScreenViewer.prototype, "screenName", null);
__decorate([
    property(Boolean)
], ScreenViewer.prototype, "useStyleFromScreenForViewer", null);
ScreenViewer = ScreenViewer_1 = __decorate([
    customElement("iobroker-webui-screen-viewer")
], ScreenViewer);
export { ScreenViewer };
window.ScreenViewer = ScreenViewer;
