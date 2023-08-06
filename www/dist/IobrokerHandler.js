import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
const screenFileExtension = ".screen";
class IobrokerHandler {
    static instance = new IobrokerHandler();
    host;
    connection;
    adapterName = "webui";
    configPath = "config/";
    namespace = "webui.0";
    screensChanged = new TypedEvent();
    stylesChanged = new TypedEvent();
    _readyPromises = [];
    constructor() {
    }
    waitForReady() {
        if (!this._readyPromises)
            return Promise.resolve();
        return new Promise(res => {
            this._readyPromises.push(res);
        });
    }
    async init() {
        this.connection = new Connection({ protocol: 'ws', host: window.iobrokerHost, port: window.iobrokerPort, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        for (let p of this._readyPromises)
            p();
        this._readyPromises = null;
        console.log("ioBroker handler ready.");
    }
    _screenNames;
    _screens = new Map();
    async getScreenNames() {
        if (this._screenNames)
            return this._screenNames;
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
    async getConfig() {
        return await this._getObjectFromFile(this.configPath + "config.json");
    }
    async saveConfig(config) {
        this._saveObjectToFile(config, this.configPath + "config.json");
    }
    async _getObjectFromFile(name) {
        const file = await this.connection.readFile(this.adapterName, name, false);
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
export const iobrokerHandler = IobrokerHandler.instance;
