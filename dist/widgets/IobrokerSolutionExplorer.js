import { BaseCustomWebComponentConstructorAppend, css, html } from '/web-component-designer-demo/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { iobrokerHandler } from "../IobrokerHandler.js";
import "../SocketIoFork.js";
export class IobrokerSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._treeDiv = this._getDomElement('treeDiv');
    }
    async createTreeNodes() {
        let screensNode = { title: 'Screens', folder: true };
        let screens = await iobrokerHandler.getScreenNames();
        screensNode.children = screens.map(x => ({ title: x, folder: false, data: { type: 'screen', name: x } }));
        return [screensNode];
    }
    _loadTree() {
        if (!this._tree) {
            $(this._treeDiv).fancytree({
                icon: false,
                source: this.createTreeNodes(),
                copyFunctionsToData: true,
                extensions: ['filter'],
                dblclick: (e, d) => {
                    if (d.node.data && d.node.data.type == 'screen') {
                        window.appShell.newDocument(d.node.data.name, iobrokerHandler.getScreen(d.node.data.name));
                    }
                    return true;
                }
            });
            $(this._treeDiv).fancytree('getRootNode');
            this._tree = $(this._treeDiv).fancytree('getTree');
        }
        else {
            this._tree.reload(this.createTreeNodes());
        }
    }
    async ready() {
        this._loadTree();
        iobrokerHandler.screensChanged.on(() => this._loadTree());
    }
}
IobrokerSolutionExplorer.template = html `
        <style>
            @import url("./node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css");
        </style>
        <div id="treeDiv" class="" style="overflow: auto; width:100%">
        </div>`;
IobrokerSolutionExplorer.style = css ``;
customElements.define("iobroker-solution-explorer", IobrokerSolutionExplorer);
