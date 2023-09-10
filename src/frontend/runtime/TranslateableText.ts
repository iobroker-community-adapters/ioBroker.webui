import { BaseCustomWebComponentConstructorAppend, Disposable, DomHelper, css, customElement } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

@customElement("t-t")
export class TranslateableText extends BaseCustomWebComponentConstructorAppend {

    static style = css`
        :host {
            display: inline;
        }

        *[node-projects-hide-at-run-time] {
            display: none !important;
        }`;

    private _languageChangedHandler: Disposable;

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    connectedCallback() {
        this._languageChangedHandler = iobrokerHandler.languageChanged.on(() => this._translate);
        this._translate();
    }

    disconnectedCallback() {
        this._languageChangedHandler.dispose();
    }

    _translate() {
        DomHelper.removeAllChildnodes(this.shadowRoot);
        for (let n of this.childNodes)
            this.shadowRoot.appendChild(document.createTextNode(n.textContent));
    }
}
