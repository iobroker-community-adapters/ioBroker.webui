import { BaseCustomWebComponentConstructorAppend, customElement, DomHelper, htmlFromString, property } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../IobrokerHandler";

@customElement("iobroker-webui-screen-viewer")
export class ScreenViewer extends BaseCustomWebComponentConstructorAppend {

    _states: { [name: string]: any } = {};
    _subscriptions = new Set<string>();

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

    constructor() {
        super();
    }

    ready() {
        this._parseAttributesToProperties();
        iobrokerHandler.screensChanged.on(() => this._loadScreen());
        this._loadScreen();
    }

    private _loadScreen() {
        const template = htmlFromString(iobrokerHandler.getScreen(this.screenName));
        const documentFragment = template.content.cloneNode(true);
        this._bindingsParse(documentFragment);
        DomHelper.removeAllChildnodes(this.shadowRoot);
        this.shadowRoot.appendChild(documentFragment);
    }

    state(name: string) {
        if (!this._subscriptions.has(name)) {
            this._subscriptions.add(name);
            this._states[name] = null;
            iobrokerHandler.adminConnection.subscribeState(name, (id, state) => {
                this._states[name] = state.val;
                this._bindingsRefresh();
            })
        }
        return this._states[name];
    }

    set(name: string, value: ioBroker.StateValue) {
        iobrokerHandler.adminConnection.setState(name, value);
    }
}
