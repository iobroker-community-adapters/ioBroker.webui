import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { IElementDefinition } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../IobrokerHandler.js";
import "../SocketIoFork.js"

export class IobrokerSolutionExplorer extends BaseCustomWebComponentConstructorAppend {

    public static override template = html`
        <style>
            @import url("./node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css");
        </style>
        <div id="treeDiv" class="" style="overflow: auto; width:100%">
        </div>`

    public static override style = css``

    private _treeDiv: HTMLDivElement;
    //@ts-ignore
    private _tree: Fancytree.Fancytree;

    constructor() {
        super();
        this._treeDiv = this._getDomElement<HTMLDivElement>('treeDiv');
    }

    private async createTreeNodes() {
        let screensNode: Fancytree.NodeData = { title: 'Screens', folder: true }

        let screens = await iobrokerHandler.getScreenNames();
        screensNode.children = screens.map(x => ({ title: x, folder: false, data: { type: 'screen', name: x } }));

        return [screensNode];
    }

    private _loadTree() {
        if (!this._tree) {
            $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
                icon: false,
                source: this.createTreeNodes(),
                copyFunctionsToData: true,
                extensions: ['dnd5'],
                dblclick: (e, d) => {
                    if (d.node.data && d.node.data.type == 'screen') {
                        window.appShell.newDocument(d.node.data.name, iobrokerHandler.getScreen(d.node.data.name));
                    }
                    return true;
                },
                dnd5: {
                    dropMarkerParent: this.shadowRoot,
                    preventRecursion: true, // Prevent dropping nodes on own descendants
                    preventVoidMoves: false,
                    dropMarkerOffsetX: -24,
                    dropMarkerInsertOffsetX: -16,

                    dragStart: (node, data) => {
                        const screen = data.node.data.name;
                        const elementDef: IElementDefinition = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' }
                        data.effectAllowed = "all";
                        data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                        data.dropEffect = "copy";
                        return true;
                    },
                    dragEnter: (node, data) => {
                        return false;
                    }
                }
            });

            $(this._treeDiv).fancytree('getRootNode');
            this._tree = $(this._treeDiv).fancytree('getTree');
        } else {
            this._tree.reload(this.createTreeNodes());
        }
    }

    async ready() {
        this._loadTree()
        iobrokerHandler.screensChanged.on(() => this._loadTree());
    }
}

customElements.define("iobroker-solution-explorer", IobrokerSolutionExplorer)