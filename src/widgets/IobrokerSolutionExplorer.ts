import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent"; import "../Socket"
export class IobrokerSolutionExplorer extends BaseCustomWebComponentConstructorAppend {

    public static override template = html``

    public static override style = css``

    constructor() {
        super();
    }

    async ready() {
        let screens = await window.iobrokerHandler.getScreens();
        for (let s of screens)
            this.shadowRoot.appendChild(document.createTextNode(s));

    }
}

customElements.define("iobroker-solution-explorer", IobrokerSolutionExplorer)