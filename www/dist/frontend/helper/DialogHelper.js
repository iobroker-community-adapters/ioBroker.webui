import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
export class IoBrokerWebuiDialog extends BaseCustomWebComponentConstructorAppend {
    container;
    uniqueId;
    static template = html `
        <div id="root" class="dialog-box">
            <h3 id="head" class="dialog-title">&nbsp;</h3>
            <a id="close" href="javascript:;" class="dialog-close" title="Close">&times;</a>
            <div id="content" class="dialog-content"></div>
        </div>`;
    static style = css `
            #root {
                width: 100%;
                height: 100%;
            }

            .dialog-title {
                margin:0;
                padding:0;
                font:inherit;
                color:inherit;
                font-weight:bold;
                height:2em;
                line-height:2em;
                overflow:hidden;
                padding:0 .8em;
                background-color:#eee;
            }

            .dialog-content {
                border-top:1px solid #ccc;
                position:absolute;
                top:2em;
                right:0;
                left:0;
                overflow:auto;
                height: calc(100% - 2em - 1px);
            }

            .dialog-content::-webkit-scrollbar {
                width:8px;
                height:8px;
                background-color:#f5f5f5;
                border-left:1px solid #ccc;
            }
            .dialog-content::-webkit-scrollbar-thumb {
                background-color:#666;
                border:none;
            }
            .dialog-content::-webkit-scrollbar-thumb:hover {background-color:#555}
            .dialog-content::-webkit-scrollbar-thumb:active {background-color:#444}
          

            .dialog-close {
                border:none;
                outline:none;
                background:none;
                font:inherit;
                font-family:Arial,Sans-Serif;
                font-style:normal;
                font-weight:bold;
                font-size:150%;
                line-height:1.4em;
                color:#aaa;
                text-decoration:none;
                position:absolute;
                top:0;
                right:.3em;
                text-align:center;
                cursor:pointer;
            }
            .dialog-close:focus {
                border-width:0;
                outline:none;
            }
            .dialog-close:hover,
            .dialog-close:focus { color: #C90000 }
            .dialog-close:active { color: #444 }
        `;
    static is = 'iobroker-webui-dialog';
    get moveable() {
        return this.#dialogTitle.style.cursor == 'move';
    }
    set moveable(value) {
        if (value) {
            this.#dialogTitle.style.cursor = 'move';
            this.#dialogTitle.onpointerdown = e => {
                this.#moveStart(e);
                return false;
            };
        }
    }
    get closeable() {
        return this.#dialogClose.style.display != 'none';
    }
    set closeable(value) {
        if (value) {
            this.#dialogClose.style.display = 'block';
        }
        else {
            this.#dialogClose.style.display = 'none';
        }
    }
    #dialogTitle;
    #dialogClose;
    #dialogContent;
    #xOffset;
    #yOffset;
    #moveBound;
    #moveEndBound;
    constructor() {
        super();
        this.#dialogTitle = this._getDomElement('head');
        this.#dialogClose = this._getDomElement('close');
        this.#dialogContent = this._getDomElement('content');
        this.#dialogClose.onclick = () => {
            this.#closeDialog();
        };
        this.#moveBound = this.#move.bind(this);
        this.#moveEndBound = this.#moveEnd.bind(this);
    }
    static offsetWidth = 2;
    static offsetHeight = 35;
    static openDialog(options) {
        const uniqueId = 'id' + new Date().getTime();
        const dlg = new IoBrokerWebuiDialog();
        if (typeof options.title === 'string')
            dlg.#dialogTitle.innerHTML = options.title;
        else
            dlg.#dialogTitle.appendChild(options.title);
        if (typeof options.content === 'string')
            dlg.#dialogContent.innerHTML = options.content;
        else
            dlg.#dialogContent.appendChild(options.content);
        dlg.style.width = options.width ?? "300px";
        dlg.style.height = options.height ?? "200px";
        dlg.style.width = "calc(" + dlg.style.width + " + " + this.offsetWidth + "px)";
        dlg.style.height = "calc(" + dlg.style.height + " + " + this.offsetHeight + "px)";
        dlg.style.top = options.top ?? 'calc(50% - ((' + dlg.style.height + ') / 2))';
        dlg.style.left = options.left ?? 'calc(50% - ((' + dlg.style.width + ') / 2))';
        if (options.moveable) {
            dlg.moveable = true;
        }
        if (options.closeable === false || options.closeable === true) {
            dlg.closeable = options.closeable;
        }
        document.getElementById('overlayLayer').appendChild(dlg);
        return uniqueId;
    }
    static closeDialog(options) {
        let el = options.element;
        while (!(el instanceof IoBrokerWebuiDialog && el != null)) {
            el = el.getRootNode()?.host;
        }
        if (el) {
            el.#closeDialog();
        }
    }
    #closeDialog() {
        document.getElementById('overlayLayer').removeChild(this);
    }
    #moveStart(e) {
        const rc = this.getBoundingClientRect();
        this.#xOffset = e.x - rc.x;
        this.#yOffset = e.y - rc.y;
        window.addEventListener('pointermove', this.#moveBound);
        window.addEventListener('pointerup', this.#moveEndBound);
    }
    #move(e) {
        this.style.left = (e.x - this.#xOffset) + 'px';
        this.style.top = (e.y - this.#yOffset) + 'px';
    }
    #moveEnd() {
        window.removeEventListener('pointermove', this.#moveBound);
        window.removeEventListener('pointerup', this.#moveEndBound);
    }
}
customElements.define(IoBrokerWebuiDialog.is, IoBrokerWebuiDialog);
