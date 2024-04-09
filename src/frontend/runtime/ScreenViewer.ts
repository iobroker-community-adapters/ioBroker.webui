import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, Disposable, DomHelper, property } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ICustomControlScript } from "../interfaces/ICustomControlScript.js";
import type { IScreenSettings } from "../interfaces/IScreen.js";
import { convertCssUnitToPixel } from "@node-projects/web-component-designer/dist/elements/helper/CssUnitConverter.js";

@customElement("iobroker-webui-screen-viewer")
export class ScreenViewer extends BaseCustomWebComponentConstructorAppend {

    static style = css`
    :host {
        height: 100%;
        position: relative;
        display: block;
    }

    *[node-projects-hide-at-run-time] {
        display: none !important;
    }
    `

    private _iobBindings: (() => void)[];
    private _loading: boolean;
    private _refreshViewSubscription: Disposable;

    private _screenName: string;
    private _screensChangedSubscription: Disposable;
    private _scriptObject: ICustomControlScript;
    private _resizeObserver: ResizeObserver;

    #eventListeners: [name: string, callback: (...args) => void][] = [];

    @property()
    get screenName() {
        return this._screenName;
    }
    set screenName(value: string) {
        if (this._screenName != value) {
            this._screenName = value;
            this._loadScreen();
        }
    }

    _relativeSignalsPath: string;
    @property()
    get relativeSignalsPath() {
        return this._relativeSignalsPath;
    }
    set relativeSignalsPath(value: string) {
        if (this._relativeSignalsPath != value) {
            this._relativeSignalsPath = value;
        }
    }

    public objects: any;

    constructor() {
        super();
        this._restoreCachedInititalValues();
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

    private async _loadScreen() {
        if (!this._loading) {
            this._loading = true;
            await iobrokerHandler.waitForReady();
            this._loading = false;
            this.removeBindings();
            DomHelper.removeAllChildnodes(this.shadowRoot);
            const screen = await iobrokerHandler.getWebuiObject('screen', this.screenName)
            if (screen) {
                this.loadScreenData(screen.html, screen.style, screen.script, screen.settings);
            }
        }
    }

    public async loadScreenData(html: string, style: string, script: string, settings: IScreenSettings) {
        let globalStyle = iobrokerHandler.config?.globalStyle ?? '';

        if (globalStyle && style)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style, iobrokerHandler.globalStylesheet, cssFromString(style)];
        else if (globalStyle)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style, iobrokerHandler.globalStylesheet];
        else if (style)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style, cssFromString(style)];
        else
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style];

        //@ts-ignore
        const myDocument = new DOMParser().parseFromString(html, 'text/html', { includeShadowRoots: true });
        const fragment = document.createDocumentFragment();
        for (const n of myDocument.head.childNodes)
            fragment.appendChild(n);
        for (const n of myDocument.body.childNodes)
            fragment.appendChild(n);
        this.shadowRoot.appendChild(fragment);
        this._iobBindings = window.appShell.bindingsHelper.applyAllBindings(this.shadowRoot, this.relativeSignalsPath, this);
        this._scriptObject = await window.appShell.scriptSystem.assignAllScripts('screenviewer - ' + this.screenName, script, this.shadowRoot, this);

        if (settings?.stretch && settings?.stretch !== 'none') {
            this._stretchView(settings);

        }
    }

    _stretchView(settings: IScreenSettings) {
        const width = convertCssUnitToPixel(settings.width, this, 'width');
        const height = convertCssUnitToPixel(settings.height, this, 'height');

        let scaleX = this.offsetWidth / width;
        let scaleY = this.offsetHeight / height;
        let translateX = 0;
        let translateY = 0;

        if (settings.stretch == 'uniform') {
            if (scaleX > scaleY) {
                scaleX = scaleY;
                translateX = (this.offsetWidth - width) / (2 * scaleX);
            } else {
                scaleY = scaleX;
                translateY = (this.offsetHeight - height) / (2 * scaleY);
            }
        } else if (settings.stretch == 'uniformToFill') {
            if (scaleX > scaleY) {
                scaleY = scaleX;
                translateY = (this.offsetHeight - height) / (2 * scaleY);
            } else {
                scaleX = scaleY;
                translateX = (this.offsetWidth - width) / (2 * scaleX);
            }
        }

        this.style.transformOrigin = '0 0';
        this.style.scale = scaleX + ' ' + scaleY;
        this.style.translate = translateX + 'px ' + translateY + 'px';
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver(() => { this._stretchView(settings); })
            this._resizeObserver.observe(this);
        }
    }

    _getRelativeSignalsPath(): string {
        return this._relativeSignalsPath;
    }

    connectedCallback() {
        this._refreshViewSubscription = iobrokerHandler.refreshView.on(() => this._loadScreen());
        this._screensChangedSubscription = iobrokerHandler.objectsChanged.on(() => {
            if (this._screenName)
                this._loadScreen();
        });
        this._scriptObject?.connectedCallback?.(this);
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
        this._screensChangedSubscription?.dispose()
        this._scriptObject?.disconnectedCallback?.(this);

        if (this._resizeObserver)
            this._resizeObserver.disconnect();
    }

    _assignEvent(event: string, callback: (...args) => void): { remove: () => void } {
        const arrayEl: [name: string, callback: (...args) => void] = [event, callback];
        this.#eventListeners.push(arrayEl);
        this.addEventListener(event, callback);
        return {
            remove: () => {
                const index = this.#eventListeners.indexOf(arrayEl);
                this.#eventListeners.splice(index, 1);
                this.removeEventListener(event, callback);
            }
        }
    }
}
