import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { dragDropFormatNameBindingObject, ContextMenuHelper, IBindableObject, IBindableObjectsService, IElementDefinition, ServiceContainer, dragDropFormatNameElementDefinition } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../IobrokerHandler.js";
//@ts-ignore
import fancyTreeStyleSheet from "jquery.fancytree/dist/skin-win8/ui.fancytree.css" assert {type: 'css'};

export class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {

    public static override template = html`
        <div id="treeDiv" class="" style="overflow: auto; width:100%; height: 100%;">
        </div>`

    public static override style = css``

    private _treeDiv: HTMLDivElement;
    //@ts-ignore
    private _tree: Fancytree.Fancytree;
    serviceContainer: ServiceContainer;

    constructor() {
        super();
        this._treeDiv = this._getDomElement<HTMLDivElement>('treeDiv');
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [fancyTreeStyleSheet];
    }

    async ready() {

    }

    initialize(serviceContainer: ServiceContainer) {
        this.serviceContainer = serviceContainer;
        this._loadTree()
        iobrokerHandler.screensChanged.on(() => this._loadTree());
    }

    private async createTreeNodes() {
        const result = await Promise.allSettled(
            [
                this._createscreensNode(),
                this._createNpmsNode(),
                this._createControlsNode(),
                this._createChartsNode(),
                this._createObjectsNode()
            ]);
        return result.map(x => x.status == 'fulfilled' ? x.value : null);
    }

    private async _createscreensNode() {
        let screenNodeCtxMenu = (event, packageName) => {
            ContextMenuHelper.showContextMenu(null, event, null, [{
                title: 'Remove Screen', action: () => {
                    //todo
                }
            }]);
        }

        let screensNode: Fancytree.NodeData = { title: 'Screens', folder: true }

        let screens = await iobrokerHandler.getScreenNames();
        screensNode.children = screens.map(x => ({
            title: x,
            folder: false,
            contextMenu: (event => screenNodeCtxMenu(event, x)),
            data: { type: 'screen', name: x }
        }));
        return screensNode;
    }

    private async _createNpmsNode() {
        let npmNodeCtxMenu = (event, packageName) => {
            ContextMenuHelper.showContextMenu(null, event, null, [{
                title: 'Update Package', action: () => {
                    iobrokerHandler.sendCommand("updateNpm", packageName);
                }
            },
            {
                title: 'Remove Package', action: () => {
                    iobrokerHandler.sendCommand("removeNpm", packageName);
                }
            }]);
        }

        let npmsNode: Fancytree.NodeData & { contextMenu: (event) => void } = {
            title: 'Packages', folder: true, contextMenu: (event) => {
                ContextMenuHelper.showContextMenu(null, event, null, [{
                    title: 'Add Package', action: () => {
                        const packageName = prompt("NPM Package Name");
                        if (packageName)
                            iobrokerHandler.sendCommand("addNpm", packageName);
                    }
                }]);
            }
        }
        try {
            let packageJson = JSON.parse(await (await iobrokerHandler.connection.readFile(iobrokerHandler.adapterName, "widgets/package.json", false)).file);
            npmsNode.children = Object.keys(packageJson.dependencies).map(x => ({
                title: x + ' (' + packageJson.dependencies[x] + ')',
                folder: false,
                contextMenu: (event => npmNodeCtxMenu(event, x)),
                data: { type: 'npm', name: x }
            }));

            //todo
            //search every package for a package JsonFileElementsService, and look if it contains a customElements definition
            //if so, load the file, if not, try load "custom-elements.json"
        }
        catch (err) {
            console.warn("error loading package.json, may not yet exist", err);
        }

        return npmsNode;
    }

    private async _createChartsNode() {

        let chartsNode: Fancytree.NodeData = {
            title: 'Charts', folder: true, children: []
        }

        try {
            let objs = await iobrokerHandler.connection.getObjectView('flot.', 'flot.\u9999', 'chart');
            if (Object.keys(objs).length > 0) {
                let flotNode: Fancytree.NodeData = {
                    title: 'Flot', folder: true
                }
                chartsNode.children.push(flotNode);
                flotNode.children = Object.keys(objs).map(x => ({
                    title: x.split('.').pop(),
                    folder: false,
                    data: { type: 'flot', name: objs[x].native.url }
                }));
            }
        }
        catch (err) {
            console.warn("error loading package.json, may not yet exist", err);
        }

        try {
            let objs = await iobrokerHandler.connection.getObjectView('echarts.', 'echarts.\u9999', 'chart');
            if (Object.keys(objs).length > 0) {
                let flotNode: Fancytree.NodeData = {
                    title: 'ECharts', folder: true
                }
                chartsNode.children.push(flotNode);
                flotNode.children = Object.keys(objs).map(x => ({
                    title: x.split('.').pop(),
                    folder: false,
                    data: { type: 'echart', name: x }
                }));
            }
        }
        catch (err) {
            console.warn("error loading package.json, may not yet exist", err);
        }

        return chartsNode;
    }

    private async _createControlsNode() {
        let controlsNode: Fancytree.NodeData = {
            title: 'Controls', folder: true, children: []
        }

        for (const s of this.serviceContainer.elementsServices) {
            const newNode: Fancytree.NodeData = {
                title: s.name,
                folder: true,
                children: []
            };
            controlsNode.children.push(newNode);

            try {
                let elements = await s.getElements();
                for (let e of elements) {
                    newNode.children.push({
                        title: e.name ?? e.tag,
                        folder: false,
                        data: {
                            type: 'control',
                            ref: e
                        }
                    });
                }
            } catch (err) {
                console.warn('Error loading elements', err);
            }
        }

        return controlsNode;
    }

    private async _createObjectsNode() {
        const s = this.serviceContainer.bindableObjectsServices[0];
        const objectsNode: Fancytree.NodeData = {
            title: 'Objects', folder: true, lazy: true, data: { service: s }
        }
        return objectsNode;
    }

    private lazyLoad(event: any, data: any) {
        data.result = new Promise(async resolve => {
            const service: IBindableObjectsService = data.node.data.service;
            const bindable: IBindableObject<any> = data.node.data.bindable;
            let children: IBindableObject<any>[];
            if (bindable?.children)
                children = bindable.children;
            else
                children = await service.getBindableObjects(bindable);
            resolve(children.map(x => ({
                service,
                title: x.name,
                data: {
                    type: 'object',
                    bindable: x
                },
                folder: x.children !== false,
                lazy: x.children !== false
            })));
        });
    }

    private _loadTree() {
        if (!this._tree) {
            $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
                icon: false,
                source: this.createTreeNodes(),
                lazyLoad: this.lazyLoad,
                copyFunctionsToData: true,
                extensions: ['dnd5'],
                dblclick: (e, d) => {
                    if (d.node.data && d.node.data.type == 'screen') {
                        window.appShell.newDocument(d.node.data.name, iobrokerHandler.getScreen(d.node.data.name).html);
                    }
                    return true;
                },
                createNode: (event, data) => {
                    let span = data.node.span as HTMLSpanElement;
                    span.oncontextmenu = (e) => {
                        data.node.setActive();
                        if (data.node.data.contextMenu)
                            data.node.data.contextMenu(e, data);
                        e.preventDefault();
                        return false;
                    }
                },

                dnd5: {
                    dropMarkerParent: this.shadowRoot,
                    preventRecursion: true, // Prevent dropping nodes on own descendants
                    preventVoidMoves: false,
                    dropMarkerOffsetX: -24,
                    dropMarkerInsertOffsetX: -16,

                    dragStart: (node, data) => {
                        if (data.node.data.type == 'screen') {
                            const screen = data.node.data.name;
                            const elementDef: IElementDefinition = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'flot') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/flot/index.html?' + data.node.data.name;
                            const elementDef: IElementDefinition = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'echart') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/adapter/echarts/chart/index.html?preset=' + data.node.data.name;
                            const elementDef: IElementDefinition = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'object') {
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(node.data.bindable));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'control') {
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(node.data.ref));
                            data.dropEffect = "copy";
                            return true;
                        }
                        return false;
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
}

customElements.define("iobroker-webui-solution-explorer", IobrokerWebuiSolutionExplorer)