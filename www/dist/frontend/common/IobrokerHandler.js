import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { sleep } from "@node-projects/web-component-designer/dist/elements/helper/Helper.js";
const screenFileExtension = ".screen";
class IobrokerHandler {
    constructor() {
        this.adapterName = "webui";
        this.configPath = "config/";
        this.namespace = "webui.0";
        this.screensChanged = new TypedEvent();
        this.configChanged = new TypedEvent();
        this._readyPromises = [];
        this._screens = new Map();
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
            const dirs = await this.connection.readDir(this.adapterName, this.configPath + "screens");
            const screenNames = dirs
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
        this.screensChanged.emit();
    }
    async removeScreen(name) {
        await this.connection.deleteFile(this.adapterName, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens.delete(name.toLocaleLowerCase());
        this._screenNames = null;
        this.screensChanged.emit();
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
        const file = await this.connection.readFile(this.adapterName, name, false);
        if (file.mimeType == 'application/json' || file.mimeType == 'text/javascript') {
            return JSON.parse(file.file);
        }
        //@ts-ignore
        if (file.mimeType == "application/octet-stream" && file.file instanceof ArrayBuffer) {
            const dec = new TextDecoder();
            //@ts-ignore
            return JSON.parse(dec.decode(file.file));
        }
        const dec = new TextDecoder();
        //@ts-ignore
        return JSON.parse(dec.decode(Uint8Array.from(file.file.data)));
    }
    async _saveObjectToFile(obj, name) {
        const enc = new TextEncoder();
        //@ts-ignore
        await this.connection.writeFile64(this.adapterName, name, enc.encode(JSON.stringify(obj)));
    }
    async sendCommand(command, data, clientId = '') {
        await this.connection.setState(this.namespace + '.control.data', { val: data });
        await this.connection.setState(this.namespace + '.control.clientIds', { val: clientId });
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }
}
IobrokerHandler.instance = new IobrokerHandler();
export const iobrokerHandler = IobrokerHandler.instance;
