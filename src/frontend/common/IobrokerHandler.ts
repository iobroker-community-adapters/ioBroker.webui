import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "../interfaces/IScreen.js";
import { IWebUiConfig } from "../interfaces/IWebUiConfig.js";
import { sleep } from "@node-projects/web-component-designer/dist/elements/helper/Helper.js";

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
    namespaceFiles = this.namespace + '.data';

    config: IWebUiConfig;

    screensChanged = new TypedEvent<void>();
    configChanged = new TypedEvent<void>();

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
        console.log("ioBroker handler ready.")
    }

    private _screenNames: string[];
    private _screens: Map<string, IScreen> = new Map();

    async loadAllScreens() {
        let names = await this.getScreenNames();
        let p: Promise<any>[] = [];
        for (let n of names) {
            p.push(this.getScreen(n));
        }
        await Promise.all(p);
    }

    async getScreenNames() {
        if (this._screenNames) return this._screenNames;
        if (this._readyPromises)
            this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "screens")
            const screenNames = files
                .filter(x => x.file.endsWith(screenFileExtension))
                .map(x => x.file.substring(0, x.file.length - screenFileExtension.length));
            this._screenNames = screenNames;
            return screenNames;
        } catch (err) {
            console.warn('no screens loaded', err);
        }
        return []
    }

    async getScreen(name: string): Promise<IScreen> {
        let screen = this._screens.get(name.toLocaleLowerCase());
        if (!screen) {
            if (this._readyPromises)
                this.waitForReady();
            try {
                screen = await this._getObjectFromFile<IScreen>(this.configPath + "screens/" + name + screenFileExtension);
            }
            catch (err) {
                console.error("Error reading Screen", screen, err);
            }
            this._screens.set(name.toLocaleLowerCase(), screen);
        }
        return screen;
    }

    async saveScreen(name: string, screen: IScreen) {
        this._saveObjectToFile(screen, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens.set(name.toLocaleLowerCase(), screen);
        this._screenNames = null;
        this.screensChanged.emit();
    }

    async removeScreen(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens.delete(name.toLocaleLowerCase());
        this._screenNames = null;
        this.screensChanged.emit();
    }

    async getImageNames() {
        if (this._readyPromises)
            this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "images")
            const imageNames = files.map(x => x.file);
            return imageNames;
        } catch (err) { }
        return []
    }

    async saveImage(name: string, imageData: string) {
        this._saveObjectToFile(screen, "/" + this.configPath + "images/" + name.toLocaleLowerCase());
    }

    async removeImage(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "images/" + name.toLocaleLowerCase() + screenFileExtension);
    }


    private async _getConfig(): Promise<IWebUiConfig> {
        try {
            if (this._readyPromises)
                this.waitForReady();
            return await this._getObjectFromFile<IWebUiConfig>(this.configPath + "config.json");
        }
        catch (err) {
            return null;
        }
    }

    public async saveConfig() {
        this._saveObjectToFile(this.config, this.configPath + "config.json");
        this.configChanged.emit();
    }

    private async _getObjectFromFile<T>(name: string): Promise<T> {
        const file = await this.connection.readFile(this.namespaceFiles, name, false);
        if (file.mimeType == 'application/json' || file.mimeType == 'text/javascript') {
            return JSON.parse(file.file);
        }
        if (file.mimeType == "application/octet-stream" && <any>file.file instanceof ArrayBuffer) {
            const dec = new TextDecoder();
            return JSON.parse(dec.decode(<any>file.file)) as T;
        }
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(Uint8Array.from((<any>file.file).data))) as T;
    }

    private async _saveObjectToFile<T>(obj: T, name: string) {
        const enc = new TextEncoder();
        await this.connection.writeFile64(this.namespaceFiles, name, <any>enc.encode(JSON.stringify(obj)));
    }

    async sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm', data: string, clientId: string = ''): Promise<void> {
        await this.connection.setState(this.namespace + '.control.data', { val: data });
        await this.connection.setState(this.namespace + '.control.clientIds', { val: clientId });
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }
}

export const iobrokerHandler = IobrokerHandler.instance;