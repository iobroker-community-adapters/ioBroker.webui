import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "./interfaces/IScreen.js";
import { IWebUiConfig } from "./interfaces/IWebUiConfig.js";

declare global {
    interface Window {
        iobrokerHost: string;
        iobrokerPort: number;
        iobrokerWebuiRootUrl: string;
    }
}

const screenFileExtension = ".screen";

class IobrokerHandler {

    static instance = new IobrokerHandler();

    host: ioBroker.HostObject;
    connection: Connection;
    adapterName = "webui";
    configPath = "config/";

    namespace = "webui.0";

    screensChanged = new TypedEvent<void>();
    stylesChanged = new TypedEvent<void>();

    _readyPromises: (() => void)[] = [];

    constructor() {
    }

    waitForReady(): Promise<void> {
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
        console.log("ioBroker handler ready.")
    }

    private _screenNames: string[];
    private _screens: Record<string, IScreen> = {};

    async getScreenNames() {
        if (this._screenNames) return this._screenNames;
        const screenNames = (await this.connection.readDir(this.adapterName, this.configPath + "screens"))
            .filter(x => x.file.endsWith(screenFileExtension))
            .map(x => x.file.substring(0, x.file.length - screenFileExtension.length));
        this._screenNames = screenNames;
        return screenNames;
    }

    async getScreen(name: string): Promise<IScreen> {
        let screen = this._screens[name.toLocaleLowerCase()];
        if (!screen) {
            try {
                screen = await this._getObjectFromFile<IScreen>(this.configPath + "screens/" + name + screenFileExtension);
            }
            catch (err) {
                console.error("Error reading Screen", screen, err);
            }
            this._screens[name.toLocaleLowerCase()] = screen;
        }
        return screen;
    }

    async saveScreen(name: string, screen: IScreen) {
        this._saveObjectToFile(screen, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens[name.toLocaleLowerCase()] = screen;
        this.screensChanged.emit();
    }

    async removeScreen(name: string) {
        await this.connection.deleteFile(this.adapterName, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        delete this._screens.delete[name.toLocaleLowerCase()];
        this.screensChanged.emit();
    }

    async getConfig(): Promise<IWebUiConfig> {
        return await this._getObjectFromFile<IWebUiConfig>(this.configPath + "config.json");
    }

    async saveConfig(config: IWebUiConfig) {
        this._saveObjectToFile(config, this.configPath + "config.json");
    }

    private async _getObjectFromFile<T>(name: string): Promise<T> {
        const file = await this.connection.readFile(this.adapterName, name, false);
        const dec = new TextDecoder();
        //@ts-ignore
        return JSON.parse(dec.decode(Uint8Array.from(file.file.data))) as T;
    }

    private async _saveObjectToFile<T>(obj: T, name: string) {
        const enc = new TextEncoder();
        //@ts-ignore
        await this.connection.writeFile64(this.adapterName, name, enc.encode(JSON.stringify(obj)));
    }

    async sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm', data: string, clientId: string = ''): Promise<void> {
        await this.connection.setState(this.namespace + '.control.data', { val: data });
        await this.connection.setState(this.namespace + '.control.clientIds', { val: clientId });
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }
}

export const iobrokerHandler = IobrokerHandler.instance;