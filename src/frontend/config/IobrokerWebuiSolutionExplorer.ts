import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from "@node-projects/base-custom-webcomponent";
import { dragDropFormatNameBindingObject, IBindableObject, IBindableObjectsService, IElementDefinition, ServiceContainer, dragDropFormatNameElementDefinition, ContextMenu, sleep, dragDropFormatNamePropertyGrid, PropertiesHelper, copyTextToClipboard } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
//@ts-ignore
import fancyTreeStyleSheet from "jquery.fancytree/dist/skin-win8/ui.fancytree.css" assert {type: 'css'};
import { IobrokerWebuiBindableObjectsService } from "../services/IobrokerWebuiBindableObjectsService.js";
import { exportData, openFileDialog } from "../helper/Helper.js";
import { IScreen } from "../interfaces/IScreen.js";
import { IControl } from "../interfaces/IControl.js";
import { generateCustomControl, webuiCustomControlPrefix } from "../runtime/CustomControls.js";

type TreeNodeData = Fancytree.NodeData & {
    lazyload?: (event: any, data: any) => void,
    children?: TreeNodeData[] | undefined;
    autoExpand?: boolean,
    dblclick?: (event: any, data: any) => void,
    contextMenu?: (event: any, data: any) => void,
}
export class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {

    public static override template = html`
        <div id="treeDiv" class="" style="overflow: auto; width:100%; height: 100%;">
        </div>`

    public static override style = css``

    serviceContainer: ServiceContainer;

    private _treeDiv: HTMLDivElement;
    private _tree: Fancytree.Fancytree;
    private _screensNodeData: TreeNodeData;

    constructor() {
        super();
        this._treeDiv = this._getDomElement<HTMLDivElement>('treeDiv');
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [fancyTreeStyleSheet];
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

    private _lazyLoadScreensNodes(event: any, data: any) {
        data.result = new Promise<TreeNodeData[]>(async resolve => {
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
            resolve(screens.map(x => ({
                title: x,
                folder: false,
                contextMenu: (event => screenNodeCtxMenu(event, x)),
                dblclick: (e, d) => {
                    iobrokerHandler.getScreen(d.node.data.name).then(s => {
                        window.appShell.openScreenEditor(d.node.data.name, 'screen', s.html, s.style, s.typeScript ?? s.script, s.settings);
                    });
                },
                data: { type: 'screen', name: x }
            })));
        });
    }

    private async _refreshScreensNode() {
        const screensNode = this._tree.getNodeByKey('screens');
        if (screensNode) {
            screensNode.resetLazy();
            await sleep(50);
            screensNode.setExpanded(true);
        }
    }

    private async _refreshControlsNode() {
        const controlsNode = this._tree.getNodeByKey('controls');
        if (controlsNode) {
            controlsNode.resetLazy();
            await sleep(50);
            controlsNode.setExpanded(true);
        }
    }

    private async _refreshImagesNode() {
        const imagesNode = this._tree.getNodeByKey('images');
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
            lazyload: (e, data) => {
                data.result = new Promise(async resolve => {
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
                        resolve(children);
                    } catch (err) {
                        console.warn("error loading package.json, may not yet exist", err);
                    }
                    resolve([]);
                });
            }
        }

        let npmSuggestion: TreeNodeData = {
            title: 'Suggestions',
            folder: true,
            tooltip: 'doublecklick to install',
            lazy: true,
            lazyload: (e, data) => {
                data.result = new Promise(async resolve => {
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
                        resolve(children);
                    }
                    catch (err) {
                        console.warn("error loading usable-packages.json, may not yet exist", err);
                    }
                    resolve([]);
                });
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
            lazyload: (e, data) => {
                data.result = new Promise(async resolve => {
                    await iobrokerHandler.waitForReady();
                    const adapterInstances = await iobrokerHandler.getIconAdapterFoldernames();
                    const iconDirNodes: TreeNodeData[] = [];
                    for (let inst of adapterInstances) {
                        iconDirNodes.push({
                            title: inst,
                            folder: true,
                            lazy: true,
                            lazyload: (e, data) => {
                                this._createIconsNodes(inst, data, '');
                            }
                        });
                    }
                    resolve(iconDirNodes);
                });
            }
        }

        return iconsNode;
    }

    private async _createIconsNodes(instanceName: string, data, subFolder: string) {
        data.result = new Promise(async resolve => {
            let icons: TreeNodeData[] = [];
            const fileList = await iobrokerHandler.connection.readDir(instanceName, subFolder);

            for (let f of fileList) {
                if (f.isDir) {
                    icons.push({
                        title: f.file,
                        folder: true,
                        lazy: true,
                        lazyload: (e, data) => {
                            this._createIconsNodes(instanceName, data, subFolder + '/' + f.file);
                        }
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
            resolve(icons);
        });
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
            lazyload: (e, data) => {
                data.result = new Promise(async resolve => {
                    try {
                        await iobrokerHandler.waitForReady();
                        let images = await iobrokerHandler.getImageNames();
                        images.sort();
                        resolve(images.map(x => ({
                            title: x,
                            contextMenu: (event => imageChildNodeCtxMenu(event, x)),
                            icon: iobrokerHandler.imagePrefix + x,
                            data: { type: 'image', name: x }
                        })));
                    }
                    catch (err) {
                        console.warn("error loading flot charts", err);
                    }
                });
            }
        }
        return imagesNode;
    }

    private async _createChartsNode() {
        let chartsNode: TreeNodeData = {
            title: 'Charts', folder: true, lazy: true,
            lazyload: (e, data) => {
                data.result = new Promise(async resolve => {
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

                    resolve(chartNodes);
                });
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

    private _lazyLoadControlsNodes(event: any, data: any) {
        data.result = new Promise<TreeNodeData[]>(async resolve => {
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
            resolve(controls.map(x => ({
                title: x,
                folder: false,
                contextMenu: (event => controlNodeCtxMenu(event, x)),
                dblclick: (e, d) => {
                    iobrokerHandler.getCustomControl(d.node.data.name).then(s => {
                        window.appShell.openScreenEditor(d.node.data.name, 'control', s.html, s.style, s.typeScript ?? s.script, s.settings, s.properties);
                    });
                },
                data: { type: 'customcontrol', name: x }
            })));
        });
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
            lazyload: (event, node) => this._lazyLoadObjectNodes(event, node),
            contextMenu: (event) => {
                ContextMenu.show([{
                    title: 'Refresh', action: async () => {
                        (<IobrokerWebuiBindableObjectsService>s).clearCache();
                        const objectsNode = this._tree.getNodeByKey('objects');
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

    private _lazyLoadObjectNodes(event: any, data: any) {
        data.result = new Promise(async resolve => {
            const service: IBindableObjectsService = data.node.data.service;
            const bindable: IBindableObject<any> = data.node.data.bindable;
            let objs: IBindableObject<any>[];
            if (bindable?.children)
                objs = bindable.children;
            else
                objs = await service.getBindableObjects(bindable);
            resolve(objs.map(x => ({
                service,
                title: x.name,
                data: {
                    type: 'object',
                    bindable: x
                },
                contextMenu: (event) => {
                    ContextMenu.show([{
                        title: 'copy to clipboard', action: async () => {
                            copyTextToClipboard(x);
                        }
                    }], event);
                },
                folder: x.children !== false,
                lazy: x.children !== false,
                lazyload: (event, node) => this._lazyLoadObjectNodes(event, node)
            })));
        });
    }

    private _loadTree() {
        if (!this._tree) {
            $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
                icon: false,
                source: this.createTreeNodes(),
                lazyLoad: (event, n) => n.node.data.lazyload(event, n),
                copyFunctionsToData: true,
                extensions: ['dnd5'],
                dblclick: (e, data) => {
                    if (data.node.data.dblclick)
                        data.node.data.dblclick(e, data);
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
                    span.onpointerdown = async (e) => {
                        if (data.node.data.type == 'screen') {
                            data.node.data.screen = await iobrokerHandler.getScreen(data.node.data.name)
                        } else if (data.node.data.type == 'customcontrol') {
                            data.node.data.control = await iobrokerHandler.getCustomControl(data.node.data.name)
                        }
                    }
                },
                init: function (event, data) {
                    let expandChildren = (node) => {
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
                    expandChildren(data.tree.rootNode);
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
                            const screenDef: IScreen = data.node.data.screen;
                            if (screenDef?.settings?.width)
                                elementDef.defaultWidth = screenDef.settings.width;
                            if (screenDef?.settings?.height)
                                elementDef.defaultHeight = screenDef.settings.height;
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            data.effectAllowed = "all";
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'customcontrol') {
                            const control = data.node.data.name;
                            let nm = PropertiesHelper.camelToDashCase(control);
                            if (nm[0] === '-')
                                nm = nm.substring(1);
                            let name = webuiCustomControlPrefix + nm;
                            const elementDef: IElementDefinition = { tag: name }
                            const controlDef: IScreen = data.node.data.control;
                            if (controlDef?.settings.width)
                                elementDef.defaultWidth = controlDef.settings.width;
                            if (controlDef?.settings.height)
                                elementDef.defaultHeight = controlDef.settings.height;
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'image') {
                            const image = data.node.data.name;
                            const elementDef: IElementDefinition = { tag: "img", defaultAttributes: { 'src': iobrokerHandler.imagePrefix + image } }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            data.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'image', 'text': iobrokerHandler.imagePrefix + image }));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'flot') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/flot/index.html?' + data.node.data.name;
                            const elementDef: IElementDefinition = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            data.dropEffect = "copy";
                            return true;
                        } else if (data.node.data.type == 'echart') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/echarts/index.html?preset=' + data.node.data.name;
                            const elementDef: IElementDefinition = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
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
                        } else if (data.node.data.type == 'icon') {
                            const elementDef: IElementDefinition = { tag: "img", defaultAttributes: { 'src': data.node.data.file } }
                            data.effectAllowed = "all";
                            data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            data.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'icon', 'text': data.node.data.file }));
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
        } else {
            this._tree.reload(this.createTreeNodes());
        }
    }
}

customElements.define("iobroker-webui-solution-explorer", IobrokerWebuiSolutionExplorer);