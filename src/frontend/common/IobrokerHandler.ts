import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "../interfaces/IScreen.js";
import { IWebUiConfig } from "../interfaces/IWebUiConfig.js";
import { IControl } from "../interfaces/IControl.js";
import { sleep } from "../helper/Helper.js";

declare global {
    interface Window {
        iobrokerHost: string;
        iobrokerPort: number;
        iobrokerWebRootUrl: string;
        iobrokerWebuiRootUrl: string;
    }
}

const screenFileExtension = ".screen";
const controlFileExtension = ".control";

class IobrokerHandler {

    static instance = new IobrokerHandler();

    host: ioBroker.HostObject;
    connection: Connection;
    adapterName = "webui";
    configPath = "config/";

    namespace = "webui.0";
    namespaceFiles = this.namespace + '.data';
    namespaceWidgets = this.namespace + '.widgets';
    imagePrefix = '/' + this.namespaceFiles + '/config/images/';

    config: IWebUiConfig;

    screensChanged = new TypedEvent<string>();
    controlsChanged = new TypedEvent<string>();
    imagesChanged = new TypedEvent<void>();
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
        this.screensChanged.emit(name);
    }

    async removeScreen(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
        this._screens.delete(name.toLocaleLowerCase());
        this._screenNames = null;
        this.screensChanged.emit(null);
    }

    private _controlNames: string[];
    private _controls: Map<string, IControl> = new Map();

    async loadAllCustomControls() {
        await iobrokerHandler.waitForReady();
        let names = await this.getCustomControlNames();
        let p: Promise<any>[] = [];
        for (let n of names) {
            p.push(this.getCustomControl(n));
        }
        await Promise.all(p);
    }

    async getCustomControlNames() {
        if (this._controlNames) return this._controlNames;
        if (this._readyPromises)
            this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "controls")
            const controlNames = files
                .filter(x => x.file.endsWith(controlFileExtension))
                .map(x => x.file.substring(0, x.file.length - controlFileExtension.length));
            this._controlNames = controlNames;
            return controlNames;
        } catch (err) {
            console.warn('no controls loaded', err);
        }
        return []
    }

    async getCustomControl(name: string): Promise<IControl> {
        let control = this._controls.get(name.toLocaleLowerCase());
        if (!control) {
            if (this._readyPromises)
                this.waitForReady();
            try {
                control = await this._getObjectFromFile<IControl>(this.configPath + "controls/" + name + controlFileExtension);
            }
            catch (err) {
                console.error("Error reading Control", control, err);
            }
            this._controls.set(name.toLocaleLowerCase(), control);
        }
        return control;
    }

    async saveCustomControl(name: string, control: IControl) {
        this._saveObjectToFile(control, "/" + this.configPath + "controls/" + name.toLocaleLowerCase() + controlFileExtension);
        this._controls.set(name.toLocaleLowerCase(), control);
        this._controlNames = null;
        this.controlsChanged.emit(name);
    }

    async removeCustomControl(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "controls/" + name.toLocaleLowerCase() + controlFileExtension);
        this._controls.delete(name.toLocaleLowerCase());
        this._controlNames = null;
        this.controlsChanged.emit(null);
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

    async saveImage(name: string, imageData: Blob) {
        await this._saveBinaryToFile(imageData, "/" + this.configPath + "images/" + name);
        this.imagesChanged.emit();
    }

    async getImage(name: string) {
        const file = await this.connection.readFile(this.namespaceFiles, "/" + this.configPath + "images/" + name, false);
        return <{ mimType: string, file: ArrayBuffer }><any>file;
    }

    async removeImage(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "images/" + name);
        this.imagesChanged.emit();
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

    private async _saveBinaryToFile(binary: Blob, name: string) {
        await this.connection.writeFile64(this.namespaceFiles, name, await <any>binary.arrayBuffer());
    }

    async sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm', data: string, clientId: string = ''): Promise<void> {
        let p = [
            this.connection.setState(this.namespace + '.control.data', { val: data }),
            this.connection.setState(this.namespace + '.control.clientIds', { val: clientId })
        ];
        await Promise.all(p);
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }
}

export const iobrokerHandler = IobrokerHandler.instance;