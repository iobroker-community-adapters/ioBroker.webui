import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { sleep } from "../helper/Helper.js";
const screenFileExtension = ".screen";
const controlFileExtension = ".control";
class IobrokerHandler {
    constructor() {
        this.adapterName = "webui";
        this.configPath = "config/";
        this.namespace = "webui.0";
        this.namespaceFiles = this.namespace + '.data';
        this.namespaceWidgets = this.namespace + '.widgets';
        this.imagePrefix = '/' + this.namespaceFiles + '/config/images/';
        this.screensChanged = new TypedEvent();
        this.controlsChanged = new TypedEvent();
        this.imagesChanged = new TypedEvent();
        this.configChanged = new TypedEvent();
        this.changeView = new TypedEvent();
        this.refreshView = new TypedEvent();
        this._readyPromises = [];
        this._screens = new Map();
        this._controls = new Map();
        this.clientId = Date.now().toString(16);
    }
    waitForReady() {
        if (!this._readyPromises)
            return Promise.resolve();
        return new Promise(res => {
            this._readyPromises.push(res);
        });
    }
    async init() {
        //@ts-ignore
        while (!window.io)
            await sleep(5);
        this.connection = new Connection({ protocol: 'ws', host: window.iobrokerHost, port: window.iobrokerPort, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        //await this.loadAllScreens();
        let cfg = await this._getConfig();
        this.config = cfg ?? { globalStyle: null };
        for (let p of this._readyPromises)
            p();
        this._readyPromises = null;
        console.log("ioBroker handler ready.");
        let commandData;
        let commandClientIds;
        await this.connection.subscribeState(this.namespace + '.control.data', (id, state) => { commandData = state.val; });
        await this.connection.subscribeState(this.namespace + '.control.clientIds', (id, state) => { commandClientIds = state.val; });
        let v = await this.connection.getState(this.namespace + '.control.command');
        this.connection.subscribeState(this.namespace + '.control.command', (id, state) => {
            if (state.ack && state.ts != v.ts)
                this.handleCommand(state.val, commandData, commandClientIds);
        });
        this.sendCommand("uiConnected", "");
    }
    async getIconAdapterFoldernames() {
        const adapterInstances = await this.connection.getObjectViewSystem('adapter', '');
        let names = [];
        for (let nm in adapterInstances) {
            if (adapterInstances[nm]?.common?.type == 'visualization-icons' || adapterInstances[nm]?.common.name.startsWith('icons-')) {
                names.push(adapterInstances[nm]?.common.name);
            }
        }
        return names;
    }
    async loadAllScreens() {
        let names = await this.getScreenNames();
        let p = [];
        for (let n of names) {
            p.push(this.getScreen(n));
        }
        await Promise.all(p);
    }
    async getScreenNames() {
        if (this._screenNames)
            return this._screenNames;
        if (this._readyPromises)
            this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "screens");
            const screenNames = files
                .filter(x => x.file.endsWith(screenFileExtension))
                .map(x => x.file.substring(0, x.file.length - screenFileExtension.length));
            this._screenNames = screenNames;
            return screenNames;
        }
        catch (err) {
            console.warn('no screens loaded', err);
        }
        return [];
    }
    async getScreen(name) {
        let screen = this._screens.get(name.toLocaleLowerCase());
        if (!screen) {
            if (this._readyPromises)
                this.waitForReady();
            try {
                screen = await this._getObjectFromFile(this.configPath + "screens/" + name + screenFileExtension);
            }
            catch (err) {
                console.error("Error reading Screen", screen, err);
            }
            this._screens.set(name.toLocaleLowerCase(), screen);
        }
        return screen;
    }
    async saveScreen(name, screen) {
        this._saveObjectToFile(screen, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens.set(name.toLocaleLowerCase(), screen);
        this._screenNames = null;
        this.screensChanged.emit(name);
    }
    async removeScreen(name) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens.delete(name.toLocaleLowerCase());
        this._screenNames = null;
        this.screensChanged.emit(null);
    }
    async renameScreen(oldName, newName) {
        await this.connection.renameFile(this.namespaceFiles, "/" + this.configPath + "screens/" + oldName.toLocaleLowerCase() + screenFileExtension, "/" + this.configPath + "screens/" + newName.toLocaleLowerCase() + screenFileExtension);
        this._screens.delete(oldName);
        this._screens.delete(newName);
        this._screenNames = null;
        this.screensChanged.emit(null);
    }
    async loadAllCustomControls() {
        await iobrokerHandler.waitForReady();
        let names = await this.getCustomControlNames();
        let p = [];
        for (let n of names) {
            p.push(this.getCustomControl(n));
        }
        await Promise.all(p);
    }
    async getCustomControlNames() {
        if (this._controlNames)
            return this._controlNames;
        if (this._readyPromises)
            this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "controls");
            const controlNames = files
                .filter(x => x.file.endsWith(controlFileExtension))
                .map(x => x.file.substring(0, x.file.length - controlFileExtension.length));
            this._controlNames = controlNames;
            return controlNames;
        }
        catch (err) {
            console.warn('no controls loaded', err);
        }
        return [];
    }
    async getCustomControl(name) {
        let control = this._controls.get(name);
        if (!control) {
            if (this._readyPromises)
                this.waitForReady();
            try {
                control = await this._getObjectFromFile(this.configPath + "controls/" + name + controlFileExtension);
                //TODO: remove in a later version, fixes old props
                let k = Object.keys(control.properties);
                if (k.length && typeof control.properties[k[0]] == 'string') {
                    for (let p in control.properties) {
                        let prp = control.properties[p];
                        if (prp.startsWith("[")) {
                            control.properties[p] = { type: 'enum', values: JSON.parse(prp) };
                        }
                        else {
                            control.properties[p] = { type: prp };
                        }
                    }
                }
            }
            catch (err) {
                console.error("Error reading Control", control, err);
            }
            this._controls.set(name, control);
        }
        return control;
    }
    async saveCustomControl(name, control) {
        this._saveObjectToFile(control, "/" + this.configPath + "controls/" + name + controlFileExtension);
        this._controls.set(name, control);
        this._controlNames = null;
        this.controlsChanged.emit(name);
    }
    async removeCustomControl(name) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "controls/" + name + controlFileExtension);
        this._controls.delete(name);
        this._controlNames = null;
        this.controlsChanged.emit(null);
    }
    async renameCustomControl(oldName, newName) {
        await this.connection.renameFile(this.namespaceFiles, "/" + this.configPath + "controls/" + oldName + controlFileExtension, "/" + this.configPath + "controls/" + newName + controlFileExtension);
        this._controls.delete(oldName);
        this._controls.delete(newName);
        this._controlNames = null;
        this.controlsChanged.emit(null);
    }
    async getImageNames() {
        if (this._readyPromises)
            this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "images");
            const imageNames = files.map(x => x.file);
            return imageNames;
        }
        catch (err) { }
        return [];
    }
    async saveImage(name, imageData) {
        await this._saveBinaryToFile(imageData, "/" + this.configPath + "images/" + name);
        this.imagesChanged.emit();
    }
    async getImage(name) {
        const file = await this.connection.readFile(this.namespaceFiles, "/" + this.configPath + "images/" + name, false);
        return file;
    }
    async removeImage(name) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "images/" + name);
        this.imagesChanged.emit();
    }
    async _getConfig() {
        try {
            if (this._readyPromises)
                this.waitForReady();
            return await this._getObjectFromFile(this.configPath + "config.json");
        }
        catch (err) {
            return null;
        }
    }
    async saveConfig() {
        this._saveObjectToFile(this.config, this.configPath + "config.json");
        this.configChanged.emit();
    }
    async _getObjectFromFile(name) {
        const file = await this.connection.readFile(this.namespaceFiles, name, false);
        if (file.mimeType == 'application/json' || file.mimeType == 'text/javascript') {
            return JSON.parse(file.file);
        }
        if (file.mimeType == "application/octet-stream" && file.file instanceof ArrayBuffer) {
            const dec = new TextDecoder();
            return JSON.parse(dec.decode(file.file));
        }
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(Uint8Array.from(file.file.data)));
    }
    async _saveObjectToFile(obj, name) {
        const enc = new TextEncoder();
        await this.connection.writeFile64(this.namespaceFiles, name, enc.encode(JSON.stringify(obj)));
    }
    async _saveBinaryToFile(binary, name) {
        await this.connection.writeFile64(this.namespaceFiles, name, await binary.arrayBuffer());
    }
    async sendCommand(command, data) {
        let p = [
            this.connection.setState(this.namespace + '.control.data', { val: data }),
            this.connection.setState(this.namespace + '.control.clientIds', { val: this.clientId })
        ];
        await Promise.all(p);
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }
    async handleCommand(command, data, clientId = '') {
        if (clientId == '' || clientId == '*' || clientId == this.clientId) {
            switch (command) {
                case "uiReload":
                    window.location.reload();
                    break;
                case "uiRefresh":
                    this._controls.clear();
                    this._screens.clear();
                    this._screenNames = null;
                    this._controlNames = null;
                    this.refreshView.emit(data);
                    break;
                case "uiChangeView":
                    this.changeView.emit(data);
                    break;
                case "uiOpenDialog":
                    //TODO...
                    break;
                case "uiPlaySound":
                    const audio = new Audio(data);
                    audio.play();
                    break;
                case "uiRunScript":
                    //TODO...
                    break;
                case "uiAlert":
                    alert(data);
                    break;
            }
        }
    }
}
IobrokerHandler.instance = new IobrokerHandler();
export const iobrokerHandler = IobrokerHandler.instance;
