import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, Disposable, DomHelper, htmlFromString, property } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScriptSystem } from "../scripting/ScriptSystem.js";

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
    private _refreshCb: Disposable;

    _screenName: string;
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

    private async _loadScreen() {
        if (!this._loading) {
            this._loading = true;
            await iobrokerHandler.waitForReady();
            this._loading = false;
            this.removeBindings();
            DomHelper.removeAllChildnodes(this.shadowRoot);
            const screen = await iobrokerHandler.getScreen(this.screenName)
            if (screen) {
                this.loadScreenData(screen.html, screen.style);
            }
        }
    }

    public loadScreenData(html, style) {
        let globalStyle = iobrokerHandler.config?.globalStyle ?? '';

        if (globalStyle && style)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style, cssFromString(globalStyle), cssFromString(style)];
        else if (globalStyle)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style, cssFromString(globalStyle)];
        else if (style)
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style, cssFromString(style)];
        else
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer.style];

        const template = htmlFromString(html);
        const documentFragment = template.content.cloneNode(true);
        //this._bindingsParse(documentFragment, true);
        this.shadowRoot.appendChild(documentFragment);
        this._iobBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot, this.relativeSignalsPath, this);
        ScriptSystem.assignAllScripts(this.shadowRoot, this);
    }

    _getRelativeSignalsPath(): string {
        return this._relativeSignalsPath;
    }

    connectedCallback() {
        this._refreshCb = iobrokerHandler.refreshView.on(() => this._loadScreen());
    }

    disconnectedCallback() {
        this._refreshCb?.dispose();
    }
}
