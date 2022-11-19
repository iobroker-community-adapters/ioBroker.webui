import { BaseCustomWebComponentConstructorAppend, css, html } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { dragDropFormatNameBindingObject, dragDropFormatNameElementDefinition, ContextMenu } from '/webui/node_modules/@node-projects/web-component-designer/./dist/index.js';
import { iobrokerHandler } from "../IobrokerHandler.js";
//@ts-ignore
import fancyTreeStyleSheet from '/webui/node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css' assert { type: 'css' };
export class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <div id="treeDiv" class="" style="overflow: auto; width:100%; height: 100%;">
        </div>`;
    static style = css ``;
    _treeDiv;
    //@ts-ignore
    _tree;
    serviceContainer;
    constructor() {
        super();
        this._treeDiv = this._getDomElement('treeDiv');
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [fancyTreeStyleSheet];
    }
    async ready() {
    }
    initialize(serviceContainer) {
        this.serviceContainer = serviceContainer;
        this._loadTree();
        iobrokerHandler.screensChanged.on(() => this._loadTree());
    }
    async createTreeNodes() {
        const result = await Promise.allSettled([
            this._createscreensNode(),
            this._createNpmsNode(),
            this._createControlsNode(),
            this._createChartsNode(),
            this._createIconsNode(),
            this._createObjectsNode()
        ]);
        return result.map(x => x.status == 'fulfilled' ? x.value : null);
    }
    async _createscreensNode() {
        let screenNodeCtxMenu = (event, packageName) => {
            ContextMenu.show([{
                    title: 'Remove Screen', action: () => {
                        //todo
                    }
                }], event);
        };
        let screensNode = { title: 'Screens', folder: true };
        let screens = await iobrokerHandler.getScreenNames();
        screensNode.children = screens.map(x => ({
            title: x,
            folder: false,
            contextMenu: (event => screenNodeCtxMenu(event, x)),
            data: { type: 'screen', name: x }
        }));
        return screensNode;
    }
    async _createNpmsNode() {
        let npmNodeCtxMenu = (event, packageName) => {
            ContextMenu.show([{
                    title: 'Update Package', action: () => {
                        iobrokerHandler.sendCommand("updateNpm", packageName);
                    }
                },
                {
                    title: 'Remove Package', action: () => {
                        iobrokerHandler.sendCommand("removeNpm", packageName);
                    }
                }], event);
        };
        let npmsNode = {
            title: 'Packages', folder: true, contextMenu: (event) => {
                ContextMenu.show([{
                        title: 'Add Package', action: () => {
                            const packageName = prompt("NPM Package Name");
                            if (packageName)
                                iobrokerHandler.sendCommand("addNpm", packageName);
                        }
                    }], event);
            }
        };
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
    async _createIconsNode() {
        let iconsNode = {
            title: 'Icons', folder: true, children: []
        };
        const iconDirs = await iobrokerHandler.connection.readDir(iobrokerHandler.adapterName, "assets/icons");
        let results = await Promise.allSettled(iconDirs.filter(x => x.isDir).map(x => this._readIconsDir(x.file)));
        for (let r of results) {
            if (r.status == 'fulfilled')
                iconsNode.children.push(r.value);
        }
        return iconsNode;
    }
    async _readIconsDir(dirName) {
        let icons = { title: dirName, children: [] };
        const dirList = await iobrokerHandler.connection.readDir(iobrokerHandler.adapterName, "assets/icons/" + dirName);
        for (let d of dirList) {
            if (d.file.endsWith('.svg'))
                icons.children.push({ title: d.file.substring(0, d.file.length - 4), icon: './assets/icons/' + dirName + '/' + d.file, data: { type: 'icon', file: './assets/icons/' + dirName + '/' + d.file } });
        }
        return icons;
    }
    async _createChartsNode() {
        let chartsNode = {
            title: 'Charts', folder: true, children: []
        };
        try {
            let objs = await iobrokerHandler.getObjectViewCustom('chart', 'chart', 'flot.', 'flot.\u9999');
            if (Object.keys(objs).length > 0) {
                let flotNode = {
                    title: 'Flot', folder: true
                };
                chartsNode.children.push(flotNode);
                flotNode.children = Object.keys(objs).map(x => ({
                    title: x.split('.').pop(),
                    folder: false,
                    data: { type: 'flot', name: objs[x].native.url }
                }));
            }
        }
        catch (err) {
            console.warn("error loading flot charts", err);
        }
        try {
            let objs = await iobrokerHandler.getObjectViewCustom('chart', 'chart', 'echarts.', 'echarts.\u9999');
            if (Object.keys(objs).length > 0) {
                let flotNode = {
                    title: 'ECharts', folder: true
                };
                chartsNode.children.push(flotNode);
                flotNode.children = Object.keys(objs).map(x => ({
                    title: x.split('.').pop(),
                    folder: false,
                    data: { type: 'echart', name: x }
                }));
            }
        }
        catch (err) {
            console.warn("error loading echarts charts", err);
        }
        return chartsNode;
    }
    async _createControlsNode() {
        let controlsNode = {
            title: 'Controls', folder: true, children: []
        };
        for (const s of this.serviceContainer.elementsServices) {
            const newNode = {
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
            }
            catch (err) {
                console.warn('Error loading elements', err);
            }
        }
        return controlsNode;
    }
    async _createObjectsNode() {
        const s = this.serviceContainer.bindableObjectsServices[0];
        const objectsNode = {
            title: 'Objects', folder: true, lazy: true, data: { service: s }
        };
        return objectsNode;
    }
    lazyLoad(event, data) {
        data.result = new Promise(async (resolve) => {
            const service = data.node.data.service;
            const bindable = data.node.data.bindable;
            let children;
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
    _loadTree() {
        if (!this._tree) {
            $(this._treeDiv).fancytree({
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
                    let span = data.node.span;
                    span.oncontextmenu = (e) => {
                        data.node.setActive();
                        if (data.node.data.contextMenu)
                            data.node.data.contextMenu(e, data);
                        e.preventDefault();
                        return false;
                    };
                },
                dnd5: {
                    dropMarkerParent: this.shadowRoot,
                    preventRecursion: true,
                    preventVoidMoves: false,
                    dropMarkerOffsetX: -24,
                    dropMarkerInsertOffsetX: -16,
                    dragStart: (node, data) => {
                        if (data.node.data.type == 'screen') {
                            const screen = data.node.data.name;
                            const elementDef = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' };
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        }
                        else if (data.node.data.type == 'flot') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/flot/index.html?' + data.node.data.name;
                            const elementDef = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' };
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        }
                        else if (data.node.data.type == 'echart') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/echarts/index.html?preset=' + data.node.data.name;
                            const elementDef = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' };
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        }
                        else if (data.node.data.type == 'object') {
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(node.data.bindable));
                            data.dropEffect = "copy";
                            return true;
                        }
                        else if (data.node.data.type == 'control') {
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(node.data.ref));
                            data.dropEffect = "copy";
                            return true;
                        }
                        else if (data.node.data.type == 'icon') {
                            const elementDef = { tag: "iobroker-webui-svg-image", defaultAttributes: { 'src': data.node.data.file }, defaultWidth: '32px', defaultHeight: '32px' };
                            data.effectAllowed = "all";
                            data.dataTransfer.setData('text/json/elementDefintion', JSON.stringify(elementDef));
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
            //@ts-ignore
            this._tree = $.ui.fancytree.getTree(this._treeDiv);
        }
        else {
            this._tree.reload(this.createTreeNodes());
        }
    }
}
customElements.define("iobroker-webui-solution-explorer", IobrokerWebuiSolutionExplorer);
