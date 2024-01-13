import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, Disposable, DomHelper, property } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";
import { ICustomControlScript } from "../interfaces/ICustomControlScript.js";

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
            const screen = await iobrokerHandler.getObject('screen', this.screenName)
            if (screen) {
                this.loadScreenData(screen.html, screen.style, screen.script);
            }
        }
    }

    public async loadScreenData(html: string, style: string, script: string,) {
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
        for (const n of myDocument.body.childNodes)
            fragment.appendChild(n);
        this.shadowRoot.appendChild(fragment);
        this._iobBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot, this.relativeSignalsPath, this);
        this._scriptObject = await ScriptSystem.assignAllScripts(script, this.shadowRoot, this);
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
    }

    disconnectedCallback() {
        for (let e of this.#eventListeners) {
            this.removeEventListener(e[0], e[1]);
        }
        this._refreshViewSubscription?.dispose();
        this._screensChangedSubscription?.dispose()
        this._scriptObject?.disconnectedCallback?.(this);
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
