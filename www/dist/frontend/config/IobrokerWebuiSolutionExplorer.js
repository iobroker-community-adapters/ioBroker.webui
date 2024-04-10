import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from "@node-projects/base-custom-webcomponent";
import { dragDropFormatNameBindingObject, dragDropFormatNameElementDefinition, ContextMenu, sleep, dragDropFormatNamePropertyGrid, PropertiesHelper, copyTextToClipboard, NamedTools } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { exportData, openFileDialog } from "../helper/Helper.js";
import { generateCustomControl, getCustomControlName, webuiCustomControlPrefix } from "../runtime/CustomControls.js";
import { defaultOptions, defaultStyle } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from 'wunderbaum';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' with { type: 'css' };
import { defaultNewStyle } from "./IobrokerWebuiScreenEditor.js";
export class IobrokerWebuiSolutionExplorer extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <div id="treeDiv" class="" style="overflow: auto; width:100%; height: 100%;">
        </div>`;
    static style = css `
        * {
            user-select: none;
            -webkit-user-select: none;
            cursor: pointer;
        }
        
        div.wunderbaum span.wb-node i.wb-indent::before {
            content: "";
        }
        
        i.wb-icon > span.wb-badge {
            opacity: 0.4;
            font-size: 50%;
        }`;
    serviceContainer;
    _treeDiv;
    _tree;
    constructor() {
        super();
        this._treeDiv = this._getDomElement('treeDiv');
        this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, defaultStyle, IobrokerWebuiSolutionExplorer.style];
    }
    async ready() {
    }
    async initialize(serviceContainer) {
        this.serviceContainer = serviceContainer;
        iobrokerHandler.objectsChanged.on(async (x) => {
            if (x.type == 'control' && x.name)
                generateCustomControl(x.name, await iobrokerHandler.getWebuiObject(x.type, x.name));
            this._refreshNode(x.type, true);
        });
        iobrokerHandler.imagesChanged.on(() => this._refreshNode('images'));
        iobrokerHandler.additionalFilesChanged.on(() => this._refreshAdditionalFilesNode());
        await sleep(100);
        this._loadTree();
        //Preload after a timeout
        setTimeout(() => {
            serviceContainer.bindableObjectsServices[0].getBindableObjects();
        }, 1000);
    }
    async createTreeNodes() {
        const result = await Promise.allSettled([
            this._createFolderNode('screen'),
            this._createControlsNode(),
            this._createGlobalNode(),
            this._createNpmsNode(),
            this._createImagesNode(),
            this._createAdditionalFilesNode(),
            this._createChartsNode(),
            this._createIconsFolderNode(),
            this._createObjectsNode()
        ]);
        return result.map(x => x.status == 'fulfilled' ? x.value : null);
    }
    _createFolderNode(type, dir) {
        const ctxMenuItems = [{
                title: 'New ' + type, action: async () => {
                    try {
                        let screenName = prompt("New " + type + " Name:");
                        if (screenName) {
                            window.appShell.openScreenEditor((dir ?? '') + '/' + screenName, type, '', defaultNewStyle, null, {});
                        }
                    }
                    catch (err) {
                        alert("error adding: " + err);
                    }
                }
            }, {
                title: 'Import ' + type, action: async () => {
                    try {
                        let files = await openFileDialog('.' + type, true, 'text');
                        for (let f of files) {
                            let data = JSON.parse(f.data);
                            let nm = f.name;
                            if (nm.endsWith('.' + type))
                                nm = nm.substring(0, nm.length - type.length - 1);
                            await iobrokerHandler.saveObject(type, (dir ?? '') + '/' + nm, data);
                        }
                    }
                    catch (err) {
                        alert("error importing: " + err);
                    }
                }
            }, {
                title: '-'
            }, {
                title: 'Create Folder', action: async () => {
                    try {
                        const folder = prompt('Foldername');
                        if (folder) {
                            iobrokerHandler.createFolder(type, (dir ?? '') + '/' + folder);
                        }
                    }
                    catch (err) {
                        alert("error creating folder: " + err);
                    }
                }
            }];
        if (dir)
            ctxMenuItems.push({
                title: 'Remove Folder', action: async () => {
                    try {
                        const del = confirm('Do you want to delete folder: ' + type + 's' + dir);
                        if (del) {
                            iobrokerHandler.removeFolder(type, dir);
                        }
                    }
                    catch (err) {
                        alert("error removing folder: " + err);
                    }
                }
            });
        const nodeCtxMenu = (event) => {
            ContextMenu.show(ctxMenuItems, event);
        };
        let name = type + 's';
        switch (type) {
            case 'control':
                name = "CustomControls";
                break;
            case 'screen':
                name = "Screens";
                break;
            //case '':
            //    name='Additional Files';
            //    break;
        }
        return {
            contextMenu: (event => nodeCtxMenu(event)),
            title: dir ? dir.split('/').pop() : name,
            folder: true,
            autoExpand: true,
            key: type + '_' + (dir ?? ''),
            lazy: true,
            lazyload: (event, node) => this._lazyLoadFolderNodes(type, dir, event, node),
            data: { name: (dir ?? '') }
        };
    }
    async _lazyLoadFolderNodes(type, dir, event, data) {
        let nodeCtxMenu = (event, name) => {
            ContextMenu.show([{
                    title: 'Export ' + type, action: async () => {
                        let data = await iobrokerHandler.getWebuiObject(type, (dir ?? '') + '/' + name);
                        await exportData(JSON.stringify(data), name + '.' + type);
                    }
                }, /*{
                    title: 'Export Screen as XML', action: async () => {
                        let data = await iobrokerHandler.getScreen(name);
                        await exportData(screenToXml(data), name + '.screen')
                    }
                },*/
                {
                    title: 'Copy ' + type, action: async () => {
                        let newName = prompt("New Name", name);
                        if (newName && newName != name) {
                            let data = await iobrokerHandler.getWebuiObject(type, (dir ?? '') + '/' + name);
                            let copy = JSON.parse(JSON.stringify(data));
                            iobrokerHandler.saveObject(type, (dir ?? '') + '/' + newName, copy);
                        }
                    }
                }, {
                    title: 'Rename ' + type, action: async () => {
                        let newName = prompt("Rename Screen: " + name, name);
                        if (newName && name != newName) {
                            iobrokerHandler.renameObject(type, (dir ?? '') + '/' + name, (dir ?? '') + '/' + newName);
                        }
                    }
                }, {
                    title: 'Remove ' + type, action: () => {
                        if (confirm("are you sure?"))
                            iobrokerHandler.removeObject(type, (dir ?? '') + '/' + name);
                    }
                }], event);
        };
        let subFolders = await iobrokerHandler.getSubFolders(type, dir);
        let menuItems = subFolders.map(x => this._createFolderNode(type, (dir ?? '') + '/' + x));
        let objects = await iobrokerHandler.getObjectNames(type, dir);
        menuItems.push(...objects.map(x => ({
            title: x,
            folder: false,
            contextMenu: (event => nodeCtxMenu(event, x)),
            dblclick: (e, d) => {
                let nm = d.data.name;
                if (nm[0] == '/')
                    nm = nm.substring(1);
                iobrokerHandler.getWebuiObject(type, nm).then(s => {
                    if (type == 'screen') {
                        window.appShell.openScreenEditor(nm, type, s.html, s.style, s.script, s.settings);
                    }
                    else if (type == 'control') {
                        window.appShell.openScreenEditor(nm, type, s.html, s.style, s.script, s.settings, s.properties);
                    }
                });
            },
            data: { type, name: (dir ?? '') + '/' + x }
        })));
        return menuItems;
    }
    async _refreshNode(key, expand = false) {
        let node = this._tree.findKey(key);
        if (!node)
            node = this._tree.findKey(key + '_');
        if (node) {
            await node.setActive(true);
            node.resetLazy();
            if (expand) {
                await sleep(50);
                node.setExpanded(true);
            }
        }
    }
    async _refreshAdditionalFilesNode() {
        const additionalFilesNode = this._tree.findKey('additionalFiles');
        if (additionalFilesNode) {
            additionalFilesNode.resetLazy();
        }
    }
    _createGlobalNode() {
        return {
            title: 'Global',
            folder: true,
            children: [
                this._createGlobalSettingsNode(),
                this._createGlobalStyleNode(),
                this._createFontDeclarationsNode(),
                this._createGlobalScriptsNode(),
                this._createGlobalJavascriptsNode()
            ]
        };
    }
    _createGlobalSettingsNode() {
        return {
            title: 'Settings',
            folder: false,
            dblclick: (e, data) => {
                window.appShell.openGlobalConfigEditor();
            }
        };
    }
    _createGlobalStyleNode() {
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
        };
        return {
            title: 'Style',
            folder: false,
            contextMenu: (e, data) => ctxMenu(e),
            dblclick: (e, data) => {
                window.appShell.openGlobalStyleEditor(iobrokerHandler.config.globalStyle ?? '', 'global style', 'globalStyle');
            }
        };
    }
    _createFontDeclarationsNode() {
        return {
            title: 'Font Declaration Style',
            folder: false,
            dblclick: (e, data) => {
                window.appShell.openGlobalStyleEditor(iobrokerHandler.config.fontDeclarations ?? '', 'font declarations style', 'fontDeclarations');
            }
        };
    }
    _createGlobalScriptsNode() {
        return {
            title: 'Script',
            folder: false,
        };
    }
    _createGlobalJavascriptsNode() {
        return {
            title: 'Typescript',
            folder: false,
            dblclick: (e, data) => {
                window.appShell.openGlobalScriptEditor(iobrokerHandler.config.globalScript ?? '');
            }
        };
    }
    async _createNpmsNode() {
        let npmsNode = {
            title: 'Packages',
            folder: true,
            contextMenu: (event) => {
                ContextMenu.show([{
                        title: 'Add Package', action: () => {
                            const packageName = prompt("NPM Package Name");
                            if (packageName) {
                                if (window.appShell.npmState != 'idle') {
                                    alert("webui is already handling a npm request");
                                }
                                else {
                                    iobrokerHandler.sendCommand("addNpm", packageName);
                                }
                            }
                        }
                    }], event);
            },
            children: []
        };
        let npmNodeCtxMenu = (event, packageName) => {
            ContextMenu.show([{
                    title: 'Update Package', action: () => {
                        if (window.appShell.npmState != 'idle') {
                            alert("webui is already handling a npm request");
                        }
                        else {
                            iobrokerHandler.sendCommand("updateNpm", packageName);
                        }
                    }
                },
                {
                    title: 'Remove Package', action: () => {
                        if (window.appShell.npmState != 'idle') {
                            alert("webui is already handling a npm request");
                        }
                        else {
                            if (confirm("are you sure?"))
                                iobrokerHandler.sendCommand("removeNpm", packageName);
                        }
                    }
                }], event);
        };
        let npmInstalled = {
            title: 'Installed',
            folder: true,
            contextMenu: (event) => {
                ContextMenu.show([{
                        title: 'Add Package', action: () => {
                            const packageName = prompt("NPM Package Name");
                            if (packageName) {
                                if (window.appShell.npmState != 'idle') {
                                    alert("webui is already handling a npm request");
                                }
                                else {
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
                }
                catch (err) {
                    console.warn("error loading package.json, may not yet exist", err);
                }
                return [];
            }
        };
        let npmSuggestion = {
            title: 'Suggestions',
            folder: true,
            tooltip: 'doublecklick to install',
            lazy: true,
            lazyload: async (e, data) => {
                try {
                    let packages = (await import('../npm/usable-packages.json', { with: { type: 'json' } })).default;
                    packages.sort();
                    let groups = [...new Set(packages.map(x => x.split('/')[0]))];
                    let children = [];
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
                                    }
                                    else {
                                        iobrokerHandler.sendCommand("addNpm", elements[0]);
                                    }
                                }
                            });
                        }
                        else {
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
                                        }
                                        else
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
        };
        npmsNode.children.push(npmInstalled);
        npmsNode.children.push(npmSuggestion);
        return npmsNode;
    }
    async _createIconsFolderNode() {
        let iconsNode = {
            title: 'Icons',
            folder: true,
            lazy: true,
            lazyload: async (e, data) => {
                await iobrokerHandler.waitForReady();
                const adapterInstances = await iobrokerHandler.getIconAdapterFoldernames();
                const iconDirNodes = [];
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
        };
        return iconsNode;
    }
    async _createIconsNodes(instanceName, data, subFolder) {
        let icons = [];
        const fileList = await iobrokerHandler.connection.readDir(instanceName, subFolder);
        for (let f of fileList) {
            if (f.isDir) {
                icons.push({
                    title: f.file,
                    folder: true,
                    lazy: true,
                    lazyload: (e, data) => this._createIconsNodes(instanceName, data, subFolder + '/' + f.file)
                });
            }
            else {
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
    async _createImagesNode() {
        let imagesNodeCtxMenu = (event) => {
            ContextMenu.show([{
                    title: 'Import Images', action: async () => {
                        let files = await openFileDialog('.png,.gif,.jpg,.jpeg,.svg', true, 'file');
                        for (let f of files) {
                            let nm = f.name;
                            await iobrokerHandler.saveImage(nm, f.data);
                        }
                    }
                }], event);
        };
        let imageChildNodeCtxMenu = (event, image) => {
            ContextMenu.show([{
                    title: 'Export Image', action: async () => {
                        let data = await iobrokerHandler.getImage(image);
                        await exportData(data.file, image, data.mimeType);
                    }
                }, {
                    title: 'Remove Image', action: () => {
                        if (confirm("are you sure?"))
                            iobrokerHandler.removeImage(image);
                    }
                }], event);
        };
        let imagesNode = {
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
                    console.warn("error loading images", err);
                }
                return [];
            }
        };
        return imagesNode;
    }
    async _createAdditionalFilesNode() {
        let additionalFilesNodeCtxMenu = (event) => {
            ContextMenu.show([{
                    title: 'Import File', action: async () => {
                        let files = await openFileDialog('*.*', true, 'file');
                        for (let f of files) {
                            let nm = f.name;
                            await iobrokerHandler.saveAdditionalFile(nm, f.data);
                        }
                    }
                }], event);
        };
        let additionalFileNodeCtxMenu = (event, name) => {
            ContextMenu.show([{
                    title: 'Copy Path', action: async () => {
                        copyTextToClipboard(iobrokerHandler.additionalFilePrefix + name);
                    }
                }, {
                    title: 'Export File', action: async () => {
                        let data = await iobrokerHandler.getAdditionalFile(name);
                        await exportData(data.file, name, data.mimeType);
                    }
                }, {
                    title: 'Remove File', action: () => {
                        if (confirm("are you sure?"))
                            iobrokerHandler.removeAdditionalFile(name);
                    }
                }], event);
        };
        let additionalFilesNode = {
            title: 'Additional Files',
            contextMenu: (event => additionalFilesNodeCtxMenu(event)),
            folder: true,
            lazy: true,
            key: 'additionalFiles',
            lazyload: async (e, data) => {
                try {
                    await iobrokerHandler.waitForReady();
                    let additionalFiles = await iobrokerHandler.getAdditionalFileNames();
                    additionalFiles.sort();
                    return additionalFiles.map(x => ({
                        title: x,
                        contextMenu: (event => additionalFileNodeCtxMenu(event, x)),
                        data: { type: 'additionalFile', name: x }
                    }));
                }
                catch (err) {
                    console.warn("error loading additional files", err);
                }
                return [];
            }
        };
        return additionalFilesNode;
    }
    async _createChartsNode() {
        let chartsNode = {
            title: 'Charts', folder: true, lazy: true,
            lazyload: async (e, data) => {
                let chartNodes = [];
                try {
                    await iobrokerHandler.waitForReady();
                    let objs = await iobrokerHandler.connection.getObjectViewCustom('chart', 'chart', 'flot.', 'flot.\u9999');
                    if (Object.keys(objs).length > 0) {
                        let flotNode = {
                            title: 'Flot', folder: true
                        };
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
                        let flotNode = {
                            title: 'ECharts', folder: true
                        };
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
        };
        return chartsNode;
    }
    async _createControlsNode() {
        let controlsNode = {
            title: 'Controls',
            folder: true,
            children: [
                await this._createFolderNode('control'),
                await this._createWebcomponentsNode()
            ]
        };
        return controlsNode;
    }
    async _createWebcomponentsNode() {
        let controlsNode = {
            title: 'Designer', folder: true, children: []
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
                            type: 'npm',
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
            title: 'Objects',
            data: { service: s },
            folder: true,
            lazy: true,
            key: 'objects',
            lazyload: (event, data) => this._lazyLoadObjectNodes(event, data),
            contextMenu: (event) => {
                ContextMenu.show([{
                        title: 'Refresh', action: async () => {
                            s.clearCache();
                            const objectsNode = this._tree.findKey('objects');
                            if (objectsNode) {
                                objectsNode.resetLazy();
                                await sleep(50);
                                objectsNode.setExpanded(true);
                            }
                        }
                    }], event);
            },
        };
        return objectsNode;
    }
    async _lazyLoadObjectNodes(event, data) {
        const service = data.data.service;
        const bindable = data.data.bindable;
        let objs;
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
    #activeLazyLoads = new Set();
    async _loadTree() {
        let dndSourceNode = null;
        if (!this._tree) {
            this._tree = new Wunderbaum({
                ...defaultOptions,
                element: this._treeDiv,
                source: await this.createTreeNodes(),
                lazyLoad: async (e) => {
                    if (!this.#activeLazyLoads.has(e.node)) {
                        this.#activeLazyLoads.add(e.node);
                        const lazydata = await e.node.data.lazyload(e, e.node.data);
                        this.#activeLazyLoads.delete(e.node);
                        return lazydata;
                    }
                    return [];
                },
                dblclick: (e) => {
                    this.serviceContainer.globalContext.tool = null;
                    if (e.node.data.dblclick)
                        e.node.data.dblclick(e, e.node.data);
                },
                render: (e) => {
                    if (e.isNew) {
                        let span = e.nodeElem;
                        span.title = span.innerText;
                        span.oncontextmenu = (ev) => {
                            e.node.setActive();
                            if (e.node.data.contextMenu) {
                                e.node.data.contextMenu(ev, e.node.data);
                            }
                            ev.preventDefault();
                            return false;
                        };
                        span.onpointerdown = async (ev) => {
                            if (e.node.data.type == 'screen') {
                                e.node.data.screen = await iobrokerHandler.getWebuiObject('screen', e.node.data.name);
                            }
                            else if (e.node.data.type == 'control') {
                                e.node.data.control = await iobrokerHandler.getWebuiObject('control', e.node.data.name);
                            }
                        };
                    }
                },
                init: function (e) {
                    let expandChildren = (node) => {
                        if (node.data.autoExpand && !node.isExpanded()) {
                            node.setExpanded(true);
                        }
                        if (node.children && node.children.length > 0) {
                            try {
                                node.children.forEach(expandChildren);
                            }
                            catch (error) {
                            }
                        }
                    };
                    expandChildren(e.tree.root);
                },
                click: (e) => {
                    this.serviceContainer.globalContext.tool = null;
                    if (e.event) { // only for clicked items, not when elements selected via code.
                        if (e.node.data?.data?.type == 'npm' || e.node.data?.data?.type == 'control') {
                            let elDef;
                            if (e.node.data.data.type == 'npm')
                                elDef = e.node.data.data.ref;
                            else {
                                const control = e.node.data.data.name;
                                let name = getCustomControlName(control);
                                elDef = { tag: name };
                            }
                            if (elDef) {
                                let tool = this.serviceContainer.designerTools.get(elDef.tool ?? NamedTools.DrawElementTool);
                                if (typeof tool == 'function')
                                    tool = new tool(elDef);
                                this.serviceContainer.globalContext.tool = tool;
                            }
                        }
                    }
                },
                dnd: {
                    preventLazyParents: false,
                    guessDropEffect: true,
                    preventRecursion: true, // Prevent dropping nodes on own descendants
                    preventVoidMoves: false,
                    dragStart: (e) => {
                        dndSourceNode = e.node;
                        //@ts-ignore
                        e.event.target.style.opacity = '0.4';
                        if (e.node.data.data.type == 'screen') {
                            const screen = e.node.data.data.name;
                            const elementDef = { tag: "iobroker-webui-screen-viewer", defaultAttributes: { 'screen-name': screen }, defaultWidth: '300px', defaultHeight: '200px' };
                            const screenDef = e.node.data.data.screen;
                            if (screenDef?.settings?.width)
                                elementDef.defaultWidth = screenDef.settings.width;
                            if (screenDef?.settings?.height)
                                elementDef.defaultHeight = screenDef.settings.height;
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'control') {
                            const control = e.node.data.data.name;
                            let nm = PropertiesHelper.camelToDashCase(control);
                            if (nm[0] === '/')
                                nm = nm.substring(1);
                            if (nm[0] === '-')
                                nm = nm.substring(1);
                            let name = webuiCustomControlPrefix + nm.replaceAll('/', '-');
                            const elementDef = { tag: name };
                            const controlDef = e.node.data.data.control;
                            if (controlDef?.settings.width)
                                elementDef.defaultWidth = controlDef.settings.width;
                            if (controlDef?.settings.height)
                                elementDef.defaultHeight = controlDef.settings.height;
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'image') {
                            const image = e.node.data.data.name;
                            const elementDef = { tag: "img", defaultAttributes: { 'src': iobrokerHandler.imagePrefix + image } };
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", iobrokerHandler.imagePrefix + image);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'image', 'text': iobrokerHandler.imagePrefix + image }));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'additionalFile') {
                            const file = e.node.data.data.name;
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", iobrokerHandler.additionalFilePrefix + file);
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'flot') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/flot/index.html?' + e.node.data.data.name;
                            const elementDef = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' };
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", url);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'echart') {
                            const url = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/echarts/index.html?preset=' + e.node.data.data.name;
                            const elementDef = { tag: "iframe", defaultAttributes: { 'src': url }, defaultStyles: { 'border': '1px solid black;' }, defaultWidth: '400px', defaultHeight: '300px' };
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", url);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'object') {
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", e.node.data.data.bindable.fullName);
                            e.event.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(e.node.data.data.bindable));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'npm') {
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(e.node.data.data.ref));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        else if (e.node.data.data.type == 'icon') {
                            const elementDef = { tag: "img", defaultAttributes: { 'src': e.node.data.data.file } };
                            e.event.dataTransfer.effectAllowed = "all";
                            e.event.dataTransfer.setData("text/plain", e.node.data.data.file);
                            e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDef));
                            e.event.dataTransfer.setData(dragDropFormatNamePropertyGrid, JSON.stringify({ 'type': 'icon', 'text': e.node.data.data.file }));
                            e.event.dataTransfer.dropEffect = "copy";
                            return true;
                        }
                        return false;
                    },
                    //@ts-ignore
                    dragEnter: (e) => {
                        if (dndSourceNode?.data?.data?.type && e.node?.key && e.node.key.startsWith(dndSourceNode.data.data.type + '_')) {
                            e.event.dataTransfer.dropEffect = 'move';
                            return 'over';
                        }
                        return false;
                    },
                    dragOver: (e) => {
                        if (dndSourceNode?.data?.data?.type && e.node?.key && e.node.key.startsWith(dndSourceNode.data.data.type + '_')) {
                            e.event.dataTransfer.dropEffect = 'move';
                            return true;
                        }
                        return false;
                    },
                    drop: (e) => {
                        //@ts-ignore
                        dndSourceNode._rowElem.firstElementChild.style.opacity = '';
                        if (dndSourceNode?.data?.data?.type && e.node?.key && e.node.key.startsWith(dndSourceNode.data.data.type + '_')) {
                            iobrokerHandler.renameObject(dndSourceNode?.data?.data?.type, dndSourceNode?.data?.data?.name, e.node.data.data.name + '/' + dndSourceNode?.title);
                        }
                    },
                    dragEnd: (e) => {
                        //@ts-ignore
                        dndSourceNode._rowElem.firstElementChild.style.opacity = '';
                    },
                }
            });
        }
        else {
            this._tree.addChildren(this.createTreeNodes());
        }
    }
}
customElements.define("iobroker-webui-solution-explorer", IobrokerWebuiSolutionExplorer);
