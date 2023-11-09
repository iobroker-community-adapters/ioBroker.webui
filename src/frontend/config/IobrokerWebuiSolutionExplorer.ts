import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from "@node-projects/base-custom-webcomponent";
import { dragDropFormatNameBindingObject, IBindableObject, IBindableObjectsService, IElementDefinition, ServiceContainer, dragDropFormatNameElementDefinition, ContextMenu, sleep, dragDropFormatNamePropertyGrid, PropertiesHelper, copyTextToClipboard } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { IobrokerWebuiBindableObjectsService } from "../services/IobrokerWebuiBindableObjectsService.js";
import { exportData, openFileDialog } from "../helper/Helper.js";
import { IScreen } from "../interfaces/IScreen.js";
import { IControl } from "../interfaces/IControl.js";
import { generateCustomControl, webuiCustomControlPrefix } from "../runtime/CustomControls.js";
import { defaultOptions, defaultStyle } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from 'wunderbaum';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' assert { type: 'css' };
import { WunderbaumNode } from "wb_node";
import { WbClickEventType, WbNodeData, WbNodeEventType } from "types";

type TreeNodeData = WbNodeData & {
    lazyload?: (event: WbNodeEventType, data: any) => Promise<TreeNodeData[]>,
    children?: TreeNodeData[] | undefined;
    autoExpand?: boolean,
    dblclick?: (event: WbClickEventType, data: any) => void,
    contextMenu?: (event: any, data: any) => void,
}
export class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {

    public static override template = html`
        <div id="treeDiv" class="" style="overflow: auto; width:100%; height: 100%;">
        </div>`

    public static override style = css``

    serviceContainer: ServiceContainer;

    private _treeDiv: HTMLDivElement;
    private _tree: Wunderbaum;
    private _screensNodeData: TreeNodeData;

    constructor() {
        super();
        this._treeDiv = this._getDomElement<HTMLDivElement>('treeDiv');
        this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, defaultStyle];
    }

    async ready() {
    }

    async initialize(serviceContainer: ServiceContainer) {
        this.serviceContainer = serviceContainer;
        iobrokerHandler.screensChanged.on(() => this._refreshScreensNode());
        iobrokerHandler.controlsChanged.on(async (name) => {
            if (name)
                generateCustomControl(name, await iobrokerHandler.getCustomControl(name));
            this._refreshControlsNode()
        });
        iobrokerHandler.imagesChanged.on(() => this._refreshImagesNode());
        await sleep(100);
        this._loadTree();

        //Preload after a timeout
        setTimeout(() => {
            serviceContainer.bindableObjectsServices[0].getBindableObjects();
        }, 1000);

    }

    private async createTreeNodes() {
        const result = await Promise.allSettled(
            [
                this._createScreensNode(),
                this._createControlsNode(),
                this._createGlobalNode(),
                this._createNpmsNode(),
                this._createImagesNode(),
                this._createChartsNode(),
                this._createIconsFolderNode(),
                this._createObjectsNode()
            ]);
        return result.map(x => x.status == 'fulfilled' ? x.value : null);
    }

    private async _createScreensNode() {
        let screenNodeCtxMenu = (event) => {
            ContextMenu.show([{
                title: 'Import Screen', action: async () => {
                    let files = await openFileDialog('.screen', true, 'text');
                    for (let f of files) {
                        let screen: IScreen = JSON.parse(<string>f.data);
                        let nm = f.name;
                        if (nm.endsWith('.screen'))
                            nm = nm.substring(0, nm.length - 7);
                        await iobrokerHandler.saveScreen(nm, screen);
                    }
                }
            }], event);
        }

        this._screensNodeData = {
            contextMenu: (event => screenNodeCtxMenu(event)),
            title: 'Screens',
            folder: true,
            autoExpand: true,
            key: 'screens',
            lazy: true,
            lazyload: (event, node) => this._lazyLoadScreensNodes(event, node)
        }
        return this._screensNodeData;
    }

    private async _lazyLoadScreensNodes(event: any, data: any): Promise<TreeNodeData[]> {
        let screenNodeCtxMenu = (event, name) => {
            ContextMenu.show([{
                title: 'Export Screen', action: async () => {
                    let data = await iobrokerHandler.getScreen(name);
                    await exportData(JSON.stringify(data), name + '.screen')
                }
            }, {
                title: 'Rename Screen', action: async () => {
                    let newName = prompt("Rename Screen: " + name, name);
                    if (newName && name != newName) {
                        iobrokerHandler.renameScreen(name, newName);
                    }
                }
            }, {
                title: 'Remove Screen', action: () => {
                    if (confirm("are you sure?"))
                        iobrokerHandler.removeScreen(name);
                }
            }], event);
        }
        let screens = await iobrokerHandler.getScreenNames();
        return screens.map(x => ({
            title: x,
            folder: false,
            contextMenu: (event => screenNodeCtxMenu(event, x)),
            dblclick: (e, d) => {
                iobrokerHandler.getScreen(d.data.name).then(s => {
                    window.appShell.openScreenEditor(d.data.name, 'screen', s.html, s.style, s.typeScript ?? s.script, s.settings);
                });
            },
            data: { type: 'screen', name: x }
        }));
    }

    private async _refreshScreensNode() {
        const screensNode = this._tree.findKey('screens');
        if (screensNode) {
            screensNode.resetLazy();
            await sleep(50);
            screensNode.setExpanded(true);
        }
    }

    private async _refreshControlsNode() {
        const controlsNode = this._tree.findKey('controls');
        if (controlsNode) {
            controlsNode.resetLazy();
            await sleep(50);
            controlsNode.setExpanded(true);
        }
    }

    private async _refreshImagesNode() {
        const imagesNode = this._tree.findKey('images');
        if (imagesNode) {
            imagesNode.resetLazy();
        }
    }

    private _createGlobalNode(): TreeNodeData {
        return {
            title: 'Global',
            folder: true,
            children: [
                this._createGlobalSettingsNode(),
                this._createGlobalStyleNode(),
                this._createGlobalScriptsNode(),
                this._createGlobalJavascriptsNode()
            ]
        }
    }

    private _createGlobalSettingsNode(): TreeNodeData {
        return {
            title: 'Settings',
            folder: false,
            dblclick: (e, data) => {
                window.appShell.openGlobalConfigEditor();
            }
        }
    }

    private _createGlobalStyleNode(): TreeNodeData {
        let ctxMenu = (event) => {
            ContextMenu.show([{
                title: 'Add HabPanel Style', action: async () => {
                    let text = await LazyLoader.LoadText('./assets/styleTemplates/HabPanelStyle.css');
                    if (!iobrokerHandler.config.globalStyle)
                        iobrokerHandler.config.globalStyle = '';
                    iobrokerHandler.config.globalStyle += '\n\n' + text;
                    iobrokerHandler.config.globalStyle = iobrokerHandler.config.globalStyle.trim();
                    iobrokerHandler.saveConfig();
                }
            }], event);
        }
        return {
            title: 'Style',
            folder: false,
            contextMenu: (e, data) => ctxMenu(e),
            dblclick: (e, data) => {
                window.appShell.openGlobalStyleEditor(iobrokerHandler.config.globalStyle ?? '');
            }
        }
    }

    private _createGlobalScriptsNode(): TreeNodeData {
        return {
            title: 'Script',
            folder: false,
        }
    }

    private _createGlobalJavascriptsNode(): TreeNodeData {
        return {
            title: 'Typescript',
            folder: false,
            dblclick: (e, data) => {
                window.appShell.openGlobalScriptEditor(iobrokerHandler.config.globalTypeScript ?? '');
            }
        }
    }

    private async _createNpmsNode() {
        let npmsNode: TreeNodeData = {
            title: 'Packages',
            folder: true,
            contextMenu: (event) => {
                ContextMenu.show([{
                    title: 'Add Package', action: () => {
                        const packageName = prompt("NPM Package Name");
                        if (packageName) {
                            if (window.appShell.npmState != 'idle') {
                                alert("webui is already handling a npm request");
                            } else {
                                iobrokerHandler.sendCommand("addNpm", packageName);
                            }
                        }
                    }
                }], event);
            },
            children: []
        }

        let npmNodeCtxMenu = (event, packageName) => {
            ContextMenu.show([{
                title: 'Update Package', action: () => {
                    if (window.appShell.npmState != 'idle') {
                        alert("webui is already handling a npm request");
                    } else {
                        iobrokerHandler.sendCommand("updateNpm", packageName);
                    }
                }
            },
            {
                title: 'Remove Package', action: () => {
                    if (window.appShell.npmState != 'idle') {
                        alert("webui is already handling a npm request");
                    } else {
                        if (confirm("are you sure?"))
                            iobrokerHandler.sendCommand("removeNpm", packageName);
                    }
                }
            }], event);
        }

        let npmInstalled: TreeNodeData = {
            title: 'Installed',
            folder: true,
            contextMenu: (event) => {
                ContextMenu.show([{
                    title: 'Add Package', action: () => {
                        const packageName = prompt("NPM Package Name");
                        if (packageName) {
                            if (window.appShell.npmState != 'idle') {
                                alert("webui is already handling a npm request");
                            } else {
                                iobrokerHandler.sendCommand("addNpm", packageName);
                            }
                        }
                    }
                }], event);
            },
            lazy: true,
            lazyload: async (e, data) => {
                try {
                    await iobrokerHandler.waitForReady();
                    let packageJson = JSON.parse(await (await iobrokerHandler.connection.readFile(iobrokerHandler.namespaceWidgets, "package.json", false)).file);
                    let packages = Object.keys(packageJson.dependencies);
                    packages.sort();
                    let children = packages.map(x => ({
                        title: x + ' (' + packageJson.dependencies[x] + ')',
                        folder: false,
                        contextMenu: (event => npmNodeCtxMenu(event, x)),
                        data: { type: 'npm', name: x }
                    }));
                    return children;
                } catch (err) {
                    console.warn("error loading package.json, may not yet exist", err);
                }
                return [];
            }
        }

        let npmSuggestion: TreeNodeData = {
            title: 'Suggestions',
            folder: true,
            tooltip: 'doublecklick to install',
            lazy: true,
            lazyload: async (e, data) => {
                try {
                    let packages = (await import('../npm/usable-packages.json', { assert: { type: 'json' } })).default;
                    packages.sort();
                    let groups = [...new Set(packages.map(x => x.split('/')[0]))];
                    let children: TreeNodeData[] = [];
                    for (let g of groups) {
                        let elements = packages.filter(x => x.startsWith(g));
                        if (elements.length == 1) {
                            children.push({
                                title: elements[0],
                                folder: false,
                                tooltip: elements[0],
                                dblclick: (e, data) => {
                                    if (window.appShell.npmState != 'idle') {
                                        alert("webui is already handling a npm request");
                                    } else {
                                        iobrokerHandler.sendCommand("addNpm", elements[0]);
                                    }
                                }
                            });
                        } else {
                            children.push({
                                title: g,
                                folder: true,
                                tooltip: g,
                                children: elements.map(x => ({
                                    title: x.split('/')[1],
                                    folder: false,
                                    tooltip: x.split('/')[1],
                                    dblclick: (e, data) => {
                                        if (window.appShell.npmState != 'idle') {
                                            alert("webui is already handling a npm request");
                                        } else
                                            iobrokerHandler.sendCommand("addNpm", x);
                                    }
                                }))
                            });
                        }
                    }
                    return children;
                }
                catch (err) {
                    console.warn("error loading usable-packages.json, may not yet exist", err);
                }
                return [];
            }
        }

        npmsNode.children.push(npmInstalled);
        npmsNode.children.push(npmSuggestion);

        return npmsNode;
    }


    private async _createIconsFolderNode() {
        let iconsNode: TreeNodeData = {
            title: 'Icons',
            folder: true,
            lazy: true,
            lazyload: async (e, data) => {
                await iobrokerHandler.waitForReady();
                const adapterInstances = await iobrokerHandler.getIconAdapterFoldernames();
                const iconDirNodes: TreeNodeData[] = [];
                for (let inst of adapterInstances) {
                    iconDirNodes.push({
                        title: inst,
                        folder: true,
                        lazy: true,
                        lazyload: (e, data) => this._createIconsNodes(inst, data, '')
                    });
                }
                return iconDirNodes;
            }
        }

        return iconsNode;
    }

    private async _createIconsNodes(instanceName: string, data, subFolder: string) {
        let icons: TreeNodeData[] = [];
        const fileList = await iobrokerHandler.connection.readDir(instanceName, subFolder);

        for (let f of fileList) {
            if (f.isDir) {
                icons.push({
                    title: f.file,
                    folder: true,
                    lazy: true,
                    lazyload: (e, data) => this._createIconsNodes(instanceName, data, subFolder + '/' + f.file)
                });
            } else {
                if (!f.file.endsWith('.html')) {
                    const posDot = f.file.lastIndexOf('.');
                    const name = f.file.substring(0, posDot);
                    icons.push({
                        title: name,
                        contextMenu: (event) => {
                            ContextMenu.show([{
                                title: 'copy path to clipboard', action: async () => {
                                    copyTextToClipboard('/' + instanceName + subFolder + '/' + f.file);
                                }
                            }], event);
                        },
                        icon: '/' + instanceName + subFolder + '/' + f.file,
                        data: { type: 'icon', file: '/' + instanceName + subFolder + '/' + f.file }
                    });
                }
            }
        }
        return icons;
    }

    private async _createImagesNode() {
        let imagesNodeCtxMenu = (event) => {
            ContextMenu.show([{
                title: 'Import Images', action: async () => {
                    let files = await openFileDialog('.png,.gif,.jpg,.jpeg,.svg', true, 'file');
                    for (let f of files) {
                        let nm = f.name;
                        await iobrokerHandler.saveImage(nm, <File>f.data);
                    }
                }
            }], event);
        }

        let imageChildNodeCtxMenu = (event, image) => {
            ContextMenu.show([{
                title: 'Export Image', action: async () => {
                    let data = await iobrokerHandler.getImage(image);
                    await exportData(data.file, image, data.mimType)
                }
            }, {
                title: 'Remove Image', action: () => {
                    if (confirm("are you sure?"))
                        iobrokerHandler.removeImage(image);
                }
            }], event);
        }

        let imagesNode: TreeNodeData = {
            title: 'Images',
            contextMenu: (event => imagesNodeCtxMenu(event)),
            folder: true,
            lazy: true,
            key: 'images',
            lazyload: async (e, data) => {
                try {
                    await iobrokerHandler.waitForReady();
                    let images = await iobrokerHandler.getImageNames();
                    images.sort();
                    return images.map(x => ({
                        title: x,
                        contextMenu: (event => imageChildNodeCtxMenu(event, x)),
                        icon: iobrokerHandler.imagePrefix + x,
                        data: { type: 'image', name: x }
                    }));
                }
                catch (err) {
                    console.warn("error loading images charts", err);
                }
                return [];
            }
        }
        return imagesNode;
    }

    private async _createChartsNode() {
        let chartsNode: TreeNodeData = {
            title: 'Charts', folder: true, lazy: true,
            lazyload: async (e, data) => {
                let chartNodes = [];
                try {
                    await iobrokerHandler.waitForReady();
                    let objs = await iobrokerHandler.connection.getObjectViewCustom('chart', 'chart', 'flot.', 'flot.\u9999');
                    if (Object.keys(objs).length > 0) {
                        let flotNode: TreeNodeData = {
                            title: 'Flot', folder: true
                        }
                        chartNodes.push(flotNode);
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
                    await iobrokerHandler.waitForReady();
                    let objs = await iobrokerHandler.connection.getObjectViewCustom('chart', 'chart', 'echarts.', 'echarts.\u9999');
                    if (Object.keys(objs).length > 0) {
                        let flotNode: TreeNodeData = {
                            title: 'ECharts', folder: true
                        }
                        chartNodes.push(flotNode);
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
                return chartNodes;
            }
        }

        return chartsNode;
    }

    private async _createControlsNode() {
        let controlsNode: TreeNodeData = {
            title: 'Controls',
            folder: true,
            children: [
                await this._createSelfDefinedControlsNode(),
                await this._createWebcomponentsNode()
            ]
        }
        return controlsNode;
    }

    private async _createSelfDefinedControlsNode() {
        let controlsNodeCtxMenu = (event) => {
            ContextMenu.show([{
                title: 'Import Control', action: async () => {
                    let files = await openFileDialog('.control', true, 'text');
                    for (let f of files) {
                        let control: IControl = JSON.parse(<string>f.data);
                        let nm = f.name;
                        if (nm.endsWith('.control'))
                            nm = nm.substring(0, nm.length - 8);
                        await iobrokerHandler.saveCustomControl(nm, control);
                    }
                }
            }], event);
        }

        let controlsNode: TreeNodeData = {
            contextMenu: (event => controlsNodeCtxMenu(event)),
            title: 'CustomControls',
            folder: true,
            key: 'controls',
            lazy: true,
            lazyload: (event, node) => this._lazyLoadControlsNodes(event, node)
        }
        return controlsNode;
    }

    private async _lazyLoadControlsNodes(event: any, data: any) {
        let controlNodeCtxMenu = (event, name) => {
            ContextMenu.show([{
                title: 'Export Control', action: async () => {
                    let data = await iobrokerHandler.getCustomControl(name);
                    await exportData(JSON.stringify(data), name + '.control')
                }
            }, {
                title: 'Rename Control', action: async () => {
                    let newName = prompt("Rename Control: " + name, name);
                    if (newName && name != newName) {
                        iobrokerHandler.renameCustomControl(name, newName);
                    }
                }
            }, {
                title: 'Remove Control', action: () => {
                    if (confirm("are you sure?"))
                        iobrokerHandler.removeCustomControl(name);
                }
            }], event);
        }
        let controls = await iobrokerHandler.getCustomControlNames();
        return controls.map(x => ({
            title: x,
            folder: false,
            contextMenu: (event => controlNodeCtxMenu(event, x)),
            dblclick: (e, d) => {
                iobrokerHandler.getCustomControl(d.data.name).then(s => {
                    window.appShell.openScreenEditor(d.data.name, 'control', s.html, s.style, s.typeScript ?? s.script, s.settings, s.properties);
                });
            },
            data: { type: 'customcontrol', name: x }
        }));
    }

    private async _createWebcomponentsNode() {
        let controlsNode: TreeNodeData = {
            title: 'Designer', folder: true, children: []
        }

        for (const s of this.serviceContainer.elementsServices) {
            const newNode: TreeNodeData = {
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
        const objectsNode: TreeNodeData = {
            title: 'Objects',
            data: { service: s },
            folder: true,
            lazy: true,
            key: 'objects',
            lazyload: (event, data) => this._lazyLoadObjectNodes(event, data),
            contextMenu: (event) => {
                ContextMenu.show([{
                    title: 'Refresh', action: async () => {
                        (<IobrokerWebuiBindableObjectsService>s).clearCache();
                        const objectsNode = this._tree.findKey('objects');
                        if (objectsNode) {
                            objectsNode.resetLazy();
                            await sleep(50);
                            objectsNode.setExpanded(true);
                        }
                    }
                }], event);
            },
        }
        return objectsNode;
    }

    private async _lazyLoadObjectNodes(event: any, data: any) {
        const service: IBindableObjectsService = data.data.service;
        const bindable: IBindableObject<any> = data.data.bindable;
        let objs: IBindableObject<any>[];
        if (bindable?.children)
            objs = bindable.children;
        else
            objs = await service.getBindableObjects(bindable);
        return objs.map(x => ({
            title: x.name,
            data: {
                service,
                type: 'object',
                bindable: x
            },
            contextMenu: (event) => {
                ContextMenu.show([{
                    title: 'copy to clipboard', action: async () => {
                        copyTextToClipboard(x.fullName);
                    }
                }], event);
            },
            folder: x.children !== false,
            lazy: x.children !== false,
            lazyload: (event, data) => this._lazyLoadObjectNodes(event, data)
        }));
    }

    private async _loadTree() {
        if (!this._tree) {
            this._tree = new Wunderbaum({
                ...defaultOptions,
                element: this._treeDiv,
                icon: false,
                source: await this.createTreeNodes(),
                lazyLoad: (e) => e.node.data.lazyload(e, e.node.data),
                dblclick: (e) => {
                    if (e.node.data.dblclick)
                        e.node.data.dblclick(e, e.node.data);
                    return true;
                },
                render: (e) => {
                    if (e.isNew) {
                        let span = e.nodeElem;
                        span.oncontextmenu = (ev) => {
                            e.node.setActive();
                            if (e.node.data.contextMenu) {
                                e.node.data.contextMenu(ev, e.node.data);
                            }
                            ev.preventDefault();  
                            return false;
                        }
                        span.onpointerdown = async (ev) => {
                            if (e.node.data.type == 'screen') {
                                e.node.data.screen = await iobrokerHandler.getScreen(e.node.data.name)
                            } else if (e.node.data.type == 'customcontrol') {
                                e.node.data.control = await iobrokerHandler.getCustomControl(e.node.data.name)
                            }
                        }
                    }
                },
                init: function (e) {
                    let expandChildren = (node: WunderbaumNode) => {
                        if (node.data.autoExpand && !node.isExpanded()) {
                            node.setExpanded(true);
                        }
                        if (node.children && node.children.length > 0) {
                            try {
                                node.children.forEach(expandChildren);
                            } catch (error) {
                            }
                        }
                    };
                    expandChildren(e.tree.root);
                },

                dnd: {
                    guessDropEffect: true,
                    preventRecursion: true, // Prevent dropping nodes on own descendants
                    preventVoidMoves: false,
                    dragStart: (e) => {
                        if (e.node.data.data.type == 'screen') {
                            const screen = e.node.data.data.name;
                            const elementDef: IElementDefinition = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' }
                            const screenDef: IScreen = e.node.data.data.screen;
                            if (screenDef?.settings?.width)
                                elementDef.defaultWidth = screenDef.settings.width;
                            if (screenDef?.settings?.height)
                                elementDef.defaultHeight = screenDef.settings.height;
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'customcontrol') {
                            const control = e.node.data.data.name;
                            let nm = PropertiesHelper.camelToDashCase(control);
                            if (nm[0] === '-')
                                nm = nm.substring(1);
                            let name = webuiCustomControlPrefix + nm;
                            const elementDef: IElementDefinition = { tag: name }
                            const controlDef: IScreen = e.node.data.data.control;
                            if (controlDef?.settings.width)
                                elementDef.defaultWidth = controlDef.settings.width;
                            if (controlDef?.settings.height)
                                elementDef.defaultHeight = controlDef.settings.height;
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'image') {
                            const image = e.node.data.data.name;
                            const elementDef: IElementDefinition = { tag: "img", defaultAttributes: { 'src': iobrokerHandler.imagePrefix + image } }
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", iobrokerHandler.imagePrefix + image);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'image', 'text': iobrokerHandler.imagePrefix + image }));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'flot') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/flot/index.html?' + e.node.data.data.name;
                            const elementDef: IElementDefinition = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' }
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", url);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'echart') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/echarts/index.html?preset=' + e.node.data.data.name;
                            const elementDef: IElementDefinition = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' }
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", url);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'object') {
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", e.node.data.data.bindable.fullName);
                            e.event.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(e.node.data.data.bindable));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'control') {
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(e.node.data.data.ref));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        } else if (e.node.data.data.type == 'icon') {
                            const elementDef: IElementDefinition = { tag: "img", defaultAttributes: { 'src': e.node.data.data.file } }
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", e.node.data.data.file);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'icon', 'text': e.node.data.data.file }));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }

                        return false;
                    },
                    dragEnter: (e) => {
                        return false;
                    }
                }
            });
        } else {
            this._tree.addChildren(this.createTreeNodes());
        }
    }
}

customElements.define("iobroker-webui-solution-explorer", IobrokerWebuiSolutionExplorer);