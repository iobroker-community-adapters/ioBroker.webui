import { BaseCustomWebComponentConstructorAppend, css, html } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { iobrokerHandler } from "../IobrokerHandler.js";
//@ts-ignore
import fancyTreeStyleSheet from '/webui/node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css' assert { type: 'css' };
export class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <div id="treeDiv" class="" style="overflow: auto; width:100%">
        </div>`;
    static style = css ``;
    _treeDiv;
    //@ts-ignore
    _tree;
    constructor() {
        super();
        this._treeDiv = this._getDomElement('treeDiv');
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [fancyTreeStyleSheet];
    }
    async createTreeNodes() {
        let screensNode = { title: 'Screens', folder: true };
        let screens = await iobrokerHandler.getScreenNames();
        screensNode.children = screens.map(x => ({ title: x, folder: false, data: { type: 'screen', name: x } }));
        let npmsNode = { title: 'NPM', folder: true };
        try {
            let packageJson = JSON.parse(await (await iobrokerHandler.connection.readFile(iobrokerHandler.adapterName, "package.json", false)).file);
            npmsNode.children = Object.keys(packageJson.dependencies).map(x => ({ title: x + ' (' + packageJson.dependencies[x] + ')', folder: false, data: { type: 'npm', name: x } }));
        }
        catch (err) {
            console.warn("error loading package.json, may not yet exist", err);
        }
        return [screensNode, npmsNode];
    }
    _loadTree() {
        if (!this._tree) {
            $(this._treeDiv).fancytree({
                icon: false,
                source: this.createTreeNodes(),
                copyFunctionsToData: true,
                extensions: ['dnd5'],
                dblclick: (e, d) => {
                    if (d.node.data && d.node.data.type == 'screen') {
                        window.appShell.newDocument(d.node.data.name, iobrokerHandler.getScreen(d.node.data.name).html);
                    }
                    return true;
                },
                dnd5: {
                    dropMarkerParent: this.shadowRoot,
                    preventRecursion: true,
                    preventVoidMoves: false,
                    dropMarkerOffsetX: -24,
                    dropMarkerInsertOffsetX: -16,
                    dragStart: (node, data) => {
                        const screen = data.node.data.name;
                        const elementDef = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' };
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
customElements.define("iobroker-webui-solution-explorer", IobrokerWebuiSolutionExplorer);
