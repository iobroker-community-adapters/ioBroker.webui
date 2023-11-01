import { Connection } from "@iobroker/socket-client";
import { TypedEvent, cssFromString } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "../interfaces/IScreen.js";
import { IWebUiConfig } from "../interfaces/IWebUiConfig.js";
import { IControl } from "../interfaces/IControl.js";
import { sleep } from "../helper/Helper.js";
import { IGlobalScript } from "../interfaces/IGlobalScript.js";

//iob types as export so code completition in ui could be used
export type StateValue = string | number | boolean | null;
export interface State {
    /** The value of the state. */
    val: StateValue;

    /** Direction flag: false for desired value and true for actual value. Default: false. */
    ack: boolean;

    /** Unix timestamp. Default: current time */
    ts: number;

    /** Unix timestamp of the last time the value changed */
    lc: number;

    /** Name of the adapter instance which set the value, e.g. "system.adapter.web.0" */
    from: string;

    /** The user who set this value */
    user?: string;

    /** Optional time in seconds after which the state is reset to null */
    expire?: number;

    /** Optional quality of the state value */
    q?: number;

    /** Optional comment */
    c?: string;
}

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
    globalStylesheet: CSSStyleSheet;
    globalScriptInstance: IGlobalScript;

    screensChanged = new TypedEvent<string>();
    controlsChanged = new TypedEvent<string>();
    imagesChanged = new TypedEvent<void>();
    configChanged = new TypedEvent<void>();

    changeView = new TypedEvent<string>();
    refreshView = new TypedEvent<string>();

    _readyPromises: (() => void)[] = [];

    language: string;
    languageChanged = new TypedEvent<string>();

    readonly clientId;

    constructor() {
        this.clientId = Date.now().toString(16);
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

        let ci = document.getElementById('connectionInfo');
        if (ci) {
            ci.innerHTML = 'connecting...';
        }

        this.connection = new Connection({
            protocol: 'ws',
            host: window.iobrokerHost,
            port: window.iobrokerPort,
            admin5only: false,
            autoSubscribes: [],
            onError: (err) => {
                let ci = document.getElementById('connectionInfo');
                if (ci) {
                    ci.innerHTML = err;
                }
                let cs = document.getElementById('connectionState');
                if (cs) {
                    cs.style.background = 'red';
                }
            },
            onReady: () => {
                let ci = document.getElementById('connectionInfo');
                if (ci) {
                    ci.innerHTML = 'ready';
                }
                let cs = document.getElementById('connectionState');
                if (cs) {
                    cs.style.background = 'lightgreen';
                }
            }
        });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();

        let cfg = await this._getConfig();
        this.config = cfg ?? { globalStyle: null, globalScript: null, globalTypeScript: null, globalConfig: null };
        if (this.config.globalStyle)
            this.globalStylesheet = cssFromString(this.config.globalStyle);
        if (this.config.globalScript) {
            const scriptUrl = URL.createObjectURL(new Blob([this.config.globalScript], { type: 'application/javascript' }));
            this.globalScriptInstance = await importShim(scriptUrl);
            if (this.globalScriptInstance.init)
                this.globalScriptInstance.init();
        }

        for (let p of this._readyPromises)
            p();
        this._readyPromises = null;
        console.log("ioBroker handler ready.");

        let commandData;
        let commandClientIds;
        await this.connection.subscribeState(this.namespace + '.control.data', (id, state) => { commandData = state?.val });
        await this.connection.subscribeState(this.namespace + '.control.clientIds', (id, state) => { commandClientIds = state?.val });
        let v = await this.connection.getState(this.namespace + '.control.command')
        this.connection.subscribeState(this.namespace + '.control.command', (id, state) => {
            if (state?.ack && state?.ts != v?.ts)
                this.handleCommand(<any>state?.val, commandData, commandClientIds);
        });

        this.sendCommand("uiConnected", "");
    }

    private _screenNames: string[];
    private _screens: Map<string, IScreen> = new Map();

    async getIconAdapterFoldernames() {
        const adapterInstances = await this.connection.getObjectViewSystem('adapter', '');
        let names: string[] = [];
        for (let nm in adapterInstances) {
            if (adapterInstances[nm]?.common?.type == 'visualization-icons' || adapterInstances[nm]?.common.name.startsWith('icons-')) {
                names.push(adapterInstances[nm]?.common.name)
            }
        }
        return names;
    }

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
                screen = await this._getObjectFromFile<IScreen>(this.configPath + "screens/" + name.toLocaleLowerCase() + screenFileExtension);
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

    async renameScreen(oldName: string, newName: string) {
        await this.connection.renameFile(this.namespaceFiles, "/" + this.configPath + "screens/" + oldName.toLocaleLowerCase() + screenFileExtension, "/" + this.configPath + "screens/" + newName.toLocaleLowerCase() + screenFileExtension);
        this._screens.delete(oldName);
        this._screens.delete(newName);
        this._screenNames = null;
        this.getScreen(newName);
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
        let control = this._controls.get(name);
        if (!control) {
            if (this._readyPromises)
                this.waitForReady();
            try {
                control = await this._getObjectFromFile<IControl>(this.configPath + "controls/" + name + controlFileExtension);

                //TODO: remove in a later version, fixes old props
                let k = Object.keys(control.properties);
                if (k.length && typeof control.properties[k[0]] == 'string') {
                    for (let p in control.properties) {
                        let prp = <string><any>control.properties[p];
                        if (prp.startsWith("[")) {
                            control.properties[p] = { type: 'enum', values: JSON.parse(prp) };
                        } else {
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

    async saveCustomControl(name: string, control: IControl) {
        this._saveObjectToFile(control, "/" + this.configPath + "controls/" + name + controlFileExtension);
        this._controls.set(name, control);
        this._controlNames = null;
        this.controlsChanged.emit(name);
    }

    async removeCustomControl(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "controls/" + name + controlFileExtension);
        this._controls.delete(name);
        this._controlNames = null;
        this.controlsChanged.emit(null);
    }

    async renameCustomControl(oldName: string, newName: string) {
        await this.connection.renameFile(this.namespaceFiles, "/" + this.configPath + "controls/" + oldName + controlFileExtension, "/" + this.configPath + "controls/" + newName + controlFileExtension);
        this._controls.delete(oldName);
        this._controls.delete(newName);
        this._controlNames = null;
        this.getCustomControl(newName);
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
        this.globalStylesheet = null;
        this.globalScriptInstance = null;
        if (this.config.globalStyle)
            this.globalStylesheet = cssFromString(this.config.globalStyle);
        if (this.config.globalScript) {
            const scriptUrl = URL.createObjectURL(new Blob([this.config.globalScript], { type: 'application/javascript' }));
            this.globalScriptInstance = await importShim(scriptUrl);
            if (this.globalScriptInstance.init)
                this.globalScriptInstance.init();
        }
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

    public getState(id: string): Promise<State> {
        return this.connection.getState(id);
    }

    public setState(id: string, val: State | StateValue, ack?: boolean): Promise<void> {
        return this.connection.setState(id, val, ack);
    }

    async sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm' | 'uiConnected', data: string): Promise<void> {
        let p = [
            this.connection.setState(this.namespace + '.control.data', { val: data }),
            this.connection.setState(this.namespace + '.control.clientIds', { val: this.clientId })
        ];
        await Promise.all(p);
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }

    async handleCommand(command: "uiReloadPackages" | "uiReload" | "uiRefresh" | "uiChangeView" | "uiChangedView" | "uiOpenDialog" | "uiOpenedDialog" | "uiPlaySound" | "uiRunScript" | "uiAlert", data: string, clientId: string = ''): Promise<void> {
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

export const iobrokerHandler = IobrokerHandler.instance;