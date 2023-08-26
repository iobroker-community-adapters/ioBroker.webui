import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, customElement, html, property } from "@node-projects/base-custom-webcomponent";
let HabPanelLikeMenu = class HabPanelLikeMenu extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this.expanded = false;
        this._restoreCachedInititalValues();
    }
    ready() {
        this._parseAttributesToProperties();
        this._assignEvents();
    }
    switchMenu() {
        this.expanded = !this.expanded;
        if (this.expanded)
            this.style.setProperty('--menu-offset', '200px');
        else
            this.style.setProperty('--menu-offset', '0');
        /*this.animate([
            { offset: 0, '--menu-offset': '0' },
            { offset: 1, '--menu-offset': '200px' },
          ], { duration: 300, iterations: 1 });*/
    }
};
HabPanelLikeMenu.style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
        overflow: hidden;
        --menu-offset: 0;
    }

    #outer {
        width: 100%;
        height: 100%;
    }

    #menu {
        background: blue;
        position: absolute;
        height: 100%;
        width: var(--menu-offset);
        transition: width 500ms;
    }
    
    #main {
        position: absolute;
        left: var(--menu-offset);
        background: yellow;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        transition: left 500ms;
    }
    
    #head {
        height: 40px;
    }

    svg {
        fill: gray;
    }

    svg:hover {
        fill: white;
    }

    #content {
        background: green;
        height: 100%;
    }`;
HabPanelLikeMenu.template = html `
    <div id="outer"> 
        <div id="menu">
            <part name="menu"></part>
        </div>
        <div id="main">
            <div id="head">
            <svg @click="switchMenu" style="width: 20px; margin: 10px;" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <g stroke-width="1" fill-rule="evenodd" transform="translate(-212.000000, -888.000000)">
                    <path d="M230,904 L214,904 C212.896,904 212,904.896 212,906 C212,907.104 212.896,908 214,908 L230,908 C231.104,908 232,907.104 232,906 C232,904.896 231.104,904 230,904 L230,904 Z M230,896 L214,896 C212.896,896 212,896.896 212,898 C212,899.104 212.896,900 214,900 L230,900 C231.104,900 232,899.104 232,898 C232,896.896 231.104,896 230,896 L230,896 Z M214,892 L230,892 C231.104,892 232,891.104 232,890 C232,888.896 231.104,888 230,888 L214,888 C212.896,888 212,888.896 212,890 C212,891.104 212.896,892 214,892 L214,892 Z"></path>
                </g>
            </svg>
           </div>
            <div id="content">
                <part></part>
            </div>
        </div>
    </div>`;
__decorate([
    property(Array)
], HabPanelLikeMenu.prototype, "screens", void 0);
__decorate([
    property(Array)
], HabPanelLikeMenu.prototype, "expanded", void 0);
HabPanelLikeMenu = __decorate([
    customElement("iobroker-webui-hab-panel-like-menu")
], HabPanelLikeMenu);
export { HabPanelLikeMenu };
