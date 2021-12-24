import { BaseCustomWebComponentConstructorAppend, customElement, DomHelper, htmlFromString, property } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper";
import { iobrokerHandler } from "../IobrokerHandler";

@customElement("iobroker-webui-screen-viewer")
export class ScreenViewer extends BaseCustomWebComponentConstructorAppend {

    private _iobBindings: (() => void)[];

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

    _relativeStatesPath: string;
    @property()
    get relativeStatesPath() {
        return this._relativeStatesPath;
    }
    set relativeStatesPath(value: string) {
        if (this._relativeStatesPath != value) {
            this._relativeStatesPath = value;
        }
    }

    public objects: any;

    constructor() {
        super();
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

    private _loadScreen() {
        if (this._iobBindings)
            this._iobBindings.forEach(x => x());
        this._iobBindings = null;
        DomHelper.removeAllChildnodes(this.shadowRoot);
        const screen = iobrokerHandler.getScreen(this.screenName)
        if (screen) {
            this.loadScreenData(screen.html);
        }
    }

    public loadScreenData(html) {
        const template = htmlFromString(html);
        const documentFragment = template.content.cloneNode(true);
        //this._bindingsParse(documentFragment, true);
        this.shadowRoot.appendChild(documentFragment);
        this._iobBindings = IobrokerWebuiBindingsHelper.applyAllBindings(this.shadowRoot);
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
}
