import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { dragDropFormatNameElementDefinition, dragDropFormatNamePropertyGrid } from '@node-projects/web-component-designer';
export class IobrokerWebuiIconsView extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <div id="root"></div>
    `;
    static style = css `
        :host {
            box-sizing: border-box;
            background: rgb(44, 46, 53);
        }
        
        #root {
            display: flex;
            flex-wrap: wrap;
            overflow-x: hidden;
            overflow-y: scroll;
            align-content: flex-start;
            gap: 5px;
            height: calc(100% - 20px);
            padding: 10px;
        }

        #root div {
            & img {
                width: 40px;
                height: 40px;
                user-drag: none;
            }
            display: flex;
            flex-direction: column;
            align-items: center;
            color: white;
            font-size: 10px;
            width: 40px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        `;
    static is = 'iobroker-webui-icons-view';
    static properties = {};
    _root;
    _filter;
    constructor() {
        super();
        super._restoreCachedInititalValues();
        this._root = this._getDomElement('root');
    }
    async ready() {
        this._parseAttributesToProperties();
        this._assignEvents();
        for await (const f of this.iconNames()) {
            let src = /* "http://192.168.1.2:8082/" + */ f.path;
            ;
            const div = document.createElement('div');
            const img = document.createElement('img');
            img.src = src;
            img.draggable = false;
            div.title = f.name;
            div.draggable = true;
            div.appendChild(img);
            div.appendChild(document.createTextNode(f.name));
            div.ondragstart = (event) => {
                const elementDef = { tag: "img", defaultAttributes: { 'src': src } };
                event.dataTransfer.effectAllowed = "all";
                event.dataTransfer.setData("text/plain", src);
                event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                event.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'icon', 'text': src }));
                event.dataTransfer.dropEffect = "copy";
                return true;
            };
            this._root.appendChild(div);
        }
    }
    async *iconNames() {
        const adapterNames = await iobrokerHandler.getIconAdapterFoldernames();
        for (const a of adapterNames) {
            yield* this._readFolder(a, '');
        }
    }
    async *_readFolder(adapter, subFolder) {
        const fileList = await iobrokerHandler.connection.readDir(adapter, subFolder);
        for (const f of fileList) {
            if (f.isDir) {
                yield* this._readFolder(adapter, subFolder + '/' + f.file);
            }
            else {
                if (!f.file.endsWith('.html')) {
                    if (this._filter) {
                        if (!f.file.match(this._filter))
                            continue;
                    }
                    const posDot = f.file.lastIndexOf('.');
                    const name = f.file.substring(0, posDot);
                    yield {
                        name,
                        path: '/' + adapter + subFolder + '/' + f.file,
                    };
                }
            }
        }
    }
}
customElements.define(IobrokerWebuiIconsView.is, IobrokerWebuiIconsView);
