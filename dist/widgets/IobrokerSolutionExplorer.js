import { BaseCustomWebComponentConstructorAppend, css, html } from '/web-component-designer-demo/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import '../Socket.js';
export class IobrokerSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
    }
    async ready() {
        let screens = await window.iobrokerHandler.getScreens();
        for (let s of screens)
            this.shadowRoot.appendChild(document.createTextNode(s));
    }
}
IobrokerSolutionExplorer.template = html ``;
IobrokerSolutionExplorer.style = css ``;
customElements.define("iobroker-solution-explorer", IobrokerSolutionExplorer);
