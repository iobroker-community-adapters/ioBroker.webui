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
    constructor() {
    }
    async init() {
        this.connection = new Connection({ protocol: 'ws', host: window.iobrokerHost, port: window.iobrokerPort, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        console.log("ioBroker handler ready.");
    }
    _screenNames;
    _screens = {};
    async getScreenNames() {
        if (this._screenNames)
            return this._screenNames;
        const screenNames = (await this.connection.readDir(this.adapterName, this.configPath + "screens"))
            .filter(x => x.file.endsWith(screenFileExtension))
            .map(x => x.file.substring(0, x.file.length - screenFileExtension.length));
        this._screenNames = screenNames;
        return screenNames;
    }
    async getScreen(name) {
        let screen = this._screens[name.toLocaleLowerCase()];
        if (!screen) {
            try {
                screen = await this._getObjectFromFile(this.configPath + "screens/" + name + screenFileExtension);
            }
            catch (err) {
                console.error("Error reading Screen", screen, err);
            }
            this._screens[name.toLocaleLowerCase()] = screen;
        }
        return screen;
    }
    async saveScreen(name, screen) {
        this._saveObjectToFile(screen, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens[name.toLocaleLowerCase()] = screen;
        this.screensChanged.emit();
    }
    async removeScreen(name) {
        await this.connection.deleteFile(this.adapterName, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        delete this._screens.delete[name.toLocaleLowerCase()];
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
