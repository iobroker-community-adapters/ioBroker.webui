import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { IElementDefinition, dragDropFormatNameElementDefinition } from '@node-projects/web-component-designer';
import { ScreenViewer } from '../runtime/ScreenViewer.js';
import { IScreen } from '../interfaces/IScreen.js';

export class IobrokerWebuiScreensView extends BaseCustomWebComponentConstructorAppend {

    static readonly template = html`
        <div id="root"></div>
    `;

    static readonly style = css`
        :host {
            box-sizing: border-box;
            background: rgb(44, 46, 53);
        }
        * {
            box-sizing: border-box;
        }
        
        #root {
            display: flex;
            flex-wrap: wrap;
            overflow-x: hidden;
            overflow-y: scroll;
            align-content: flex-start;
            gap: 15px;
            height: calc(100% - 20px);
            padding: 10px;
        }

        #root div {
            & iobroker-webui-screen-viewer {
                width: 200px;
                height: 100px;
                user-drag: none;
                overflow: hidden;
                border: 1px solid lightgray;
                pointer-events: none;
            }
            display: flex;
            flex-direction: column;
            align-items: center;
            color: white;
            font-size: 10px;
            width: 200px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        `;

    static readonly is = 'iobroker-webui-screens-view';

    static readonly properties = {

    }

    private _root: HTMLDivElement;
    private _filter: RegExp;

    constructor() {
        super();
        super._restoreCachedInititalValues();

        this._root = this._getDomElement<HTMLDivElement>('root');
    }

    async ready() {
        this._parseAttributesToProperties();
        this._assignEvents();

        for await (const f of this._readFolder()) {
            const div = document.createElement('div');
            const sv = new ScreenViewer;
            sv.stretch = 'fill';
            const screenDef: IScreen = await iobrokerHandler.getWebuiObject('screen', f.name);
            if (!screenDef.settings?.width)
                sv.stretchWidth = 1920;
            if (!screenDef.settings?.height)
                sv.stretchHeight = 1080;
            sv.screenName = f.name;
            div.title = f.name;
            div.draggable = true;
            div.appendChild(sv);
            div.appendChild(document.createTextNode(f.name));
            div.ondragstart = async (event) => {
                const screen = f.name;
                const elementDef: IElementDefinition = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' }
                //const screenDef: IScreen = await iobrokerHandler.getWebuiObject('screen', screen);
                if (screenDef?.settings?.width)
                    elementDef.defaultWidth = screenDef.settings.width;
                if (screenDef?.settings?.height)
                    elementDef.defaultHeight = screenDef.settings.height;
                event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                event.dataTransfer.effectAllowed = "all";
                event.dataTransfer.dropEffect = "copy";
                return true;
            }
            this._root.appendChild(div);
        }
    }

    async* _readFolder(subFolder: string = ''): AsyncGenerator<{ name: string }, void, unknown> {
        const fileList = await iobrokerHandler.getObjectNames('screen', subFolder);
        for (const f of fileList) {
            if (this._filter) {
                if (!f.match(this._filter))
                    continue;
            }
            yield {
                name: (subFolder ? subFolder + '/' : '') + f,
            };
        }

        const dirList = await iobrokerHandler.getSubFolders('screen', subFolder);
        for (const d of dirList) {
            yield* this._readFolder(subFolder + '/' + d);
        }
    }
}
customElements.define(IobrokerWebuiScreensView.is, IobrokerWebuiScreensView)