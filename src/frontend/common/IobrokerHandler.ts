import { Connection } from "@iobroker/socket-client";
import { TypedEvent, cssFromString } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "../interfaces/IScreen.js";
import { IWebUiConfig } from "../interfaces/IWebUiConfig.js";
import { IControl } from "../interfaces/IControl.js";
import { sleep } from "../helper/Helper.js";
import { IGlobalScript } from "../interfaces/IGlobalScript.js";

declare global {
    interface Window {
        iobrokerHost: string;
        iobrokerPort: number;
        iobrokerWebRootUrl: string;
        iobrokerWebuiRootUrl: string;
    }
}

export class IobrokerHandler {

    static instance = new IobrokerHandler();

    host: ioBroker.HostObject;
    connection: Connection;
    adapterName = "webui";
    configPath = "config/";

    namespace = "webui.0";
    namespaceFiles = this.namespace + '.data';
    namespaceWidgets = this.namespace + '.widgets';
    imagePrefix = '/' + this.namespaceFiles + '/config/images/';
    additionalFilePrefix = '/' + this.namespaceFiles + '/config/additionalfiles/';

    config: IWebUiConfig;
    globalStylesheet: CSSStyleSheet;
    fontDeclarationsStylesheet: CSSStyleSheet;
    globalScriptInstance: IGlobalScript;

    objectsChanged = new TypedEvent<{ type: string, name: string }>();
    imagesChanged = new TypedEvent<void>();
    additionalFilesChanged = new TypedEvent<void>();
    configChanged = new TypedEvent<void>();

    changeView = new TypedEvent<string>();
    refreshView = new TypedEvent<string>();

    _readyPromises: (() => void)[] = [];

    language: string;
    languageChanged = new TypedEvent<string>();

    #cache: Map<string, Map<string, IScreen | IControl>> = new Map();
    _controlNames: string[] = null;

    readonly clientId;

    constructor() {
        this.clientId = Date.now().toString(16);
        this.#cache.set('screen', new Map());
        this.#cache.set('control', new Map());
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
        this.config = cfg ?? { globalStyle: null, globalScript: null, globalConfig: null, fontDeclarations: null };
        if (this.config.globalConfig == null) {
            this.config.globalConfig = {
                headerTags: `<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`
            }
        }
        if (this.config.globalConfig.headerTags) {
            document.head.insertAdjacentHTML('afterbegin', this.config.globalConfig.headerTags);
        }
        if (this.config.globalStyle)
            this.globalStylesheet = cssFromString(this.config.globalStyle);
        if (this.config.fontDeclarations) {
            this.fontDeclarationsStylesheet = cssFromString(this.config.fontDeclarations);
            document.adoptedStyleSheets = [this.fontDeclarationsStylesheet];
        }
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

    async getAllNames(type: 'screen' | 'control', dir?: string) {
        if (this._readyPromises)
            await this.waitForReady();
        const p: Promise<string[]>[] = [];
        p.push(this.getObjectNames(type, dir).then(x => x.map(y => (dir ? dir + '/' : '/').substring(1) + y)));
        let folders = await this.getSubFolders(type, dir);
        for (let f of folders) {
            p.push(this.getAllNames(type, (dir ?? '') + '/' + f));
        }
        const res = await Promise.all(p);
        return res.flatMap(x => x);
    }

    async getSubFolders(type: 'screen' | 'control', dir: string) {
        if (this._readyPromises)
            await this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + type + "s" + (dir ?? ""));
            const dirNames = files
                .filter(x => x.isDir)
                .map(x => x.file);
            return dirNames;
        } catch (err) {
            console.warn('error loading subfolders', err);
        }
        return [];
    }

    async getObjectNames(type: 'screen' | 'control', dir: string) {
        if (this._readyPromises)
            await this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + type + "s" + (dir ?? ""));
            const names = files
                .filter(x => x.file.endsWith('.' + type))
                .map(x => x.file.substring(0, x.file.length - type.length - 1));
            return names;
        } catch (err) {
            console.warn('no ' + type + ' loaded', err);
        }
        return [];
    }

    async getWebuiObject<T extends IScreen | IControl>(type: 'screen' | 'control', name: string): Promise<T> {
        if (type == 'screen')
            return <T><any>this.getScreen(name);
        else if (type == 'control')
            return <T><any>this.getCustomControl(name);
        return null;
    }

    private async getScreen(name: string): Promise<IScreen> {
        if (name[0] == '/')
            name = name.substring(1);
        let screen = this.#cache.get('screen').get(name);
        if (!screen) {
            if (this._readyPromises)
                await this.waitForReady();
            try {
                screen = await this._getObjectFromFile<IScreen>(this.configPath + "screens/" + name + '.screen');
            }
            catch (err) {
                console.error("Error reading Screen", screen, err);
            }
            this.#cache.get('screen').set(name, screen);
        }
        return screen;
    }

    async saveObject(type: 'screen' | 'control', name: string, data: IScreen | IControl) {
        this._saveObjectToFile(data, "/" + this.configPath + type + "s/" + name + '.' + type);
        if (this.#cache.has(type))
            this.#cache.get(type).set(name, data);
        if (type == 'control')
            this._controlNames = null;
        this.objectsChanged.emit({ type, name });
    }

    async removeObject(type: 'screen' | 'control', name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + type + "s/" + name + '.' + type);
        if (this.#cache.has(type))
            this.#cache.get(type).delete(name);
        if (type == 'control')
            this._controlNames = null;
        this.objectsChanged.emit({ type, name });
    }

    async renameObject(type: 'screen' | 'control', oldName: string, newName: string) {
        if (oldName[0] == '/')
            oldName = oldName.substring(1);
        if (newName[0] == '/')
            newName = newName.substring(1);
        await this.connection.renameFile(this.namespaceFiles, "/" + this.configPath + type + "s/" + oldName + '.' + type, "/" + this.configPath + type + "s/" + newName + '.' + type);
        if (this.#cache.has(type)) {
            this.#cache.get(type).delete(oldName);
            this.#cache.get(type).delete(newName);
        }
        if (type == 'control')
            this._controlNames = null;
        this.getWebuiObject(type, newName);
        this.objectsChanged.emit({ type, name: newName });
    }

    async createFolder(type: 'screen' | 'control', name: string) {
        await this._saveObjectToFile<any>({}, "/" + this.configPath + type + "s/" + name + '/tmp.fld');
        this.objectsChanged.emit({ type, name: null });
    }

    async removeFolder(type: 'screen' | 'control', name: string) {
        await this.connection.deleteFolder(this.namespaceFiles, "/" + this.configPath + type + "s/" + name);
        this.objectsChanged.emit({ type, name: null });
    }

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
            await this.waitForReady();
        try {
            const controlNames = await this.getAllNames('control');
            this._controlNames = controlNames;
            return controlNames;
        } catch (err) {
            console.warn('no controls loaded', err);
        }
        return []
    }

    private async getCustomControl(name: string): Promise<IControl> {
        if (name[0] == '/')
            name = name.substring(1);
        let control = <IControl>this.#cache.get('control').get(name);
        if (!control) {
            if (this._readyPromises)
                await this.waitForReady();
            try {
                control = await this._getObjectFromFile<IControl>(this.configPath + "controls/" + name + '.control');

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
            this.#cache.get('control').set(name, control);
        }
        return control;
    }

    async getImageNames() {
        if (this._readyPromises)
            await this.waitForReady();
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
        return <{ mimeType: string, file: ArrayBuffer }><any>file;
    }

    async removeImage(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "images/" + name);
        this.imagesChanged.emit();
    }

    async getAdditionalFileNames() {
        if (this._readyPromises)
            await this.waitForReady();
        try {
            const files = await this.connection.readDir(this.namespaceFiles, this.configPath + "additionalfiles")
            const additionalFileNames = files.map(x => x.file);
            return additionalFileNames;
        } catch (err) { }
        return []
    }

    async saveAdditionalFile(name: string, data: Blob) {
        await this._saveBinaryToFile(data, "/" + this.configPath + "additionalfiles/" + name);
        this.additionalFilesChanged.emit();
    }

    async getAdditionalFile(name: string) {
        const file = await this.connection.readFile(this.namespaceFiles, "/" + this.configPath + "additionalfiles/" + name, false);
        return <{ mimeType: string, file: ArrayBuffer }><any>file;
    }

    async removeAdditionalFile(name: string) {
        await this.connection.deleteFile(this.namespaceFiles, "/" + this.configPath + "additionalfiles/" + name);
        this.additionalFilesChanged.emit();
    }

    #localSubscriptions = new Map<string, ioBroker.StateChangeHandler[]>;
    #localValues = new Map<string, any>;

    async subscribeState(id: string, cb: ioBroker.StateChangeHandler): Promise<void> {
        if (id.startsWith('local_')) {
            let arr = this.#localSubscriptions.get(id);
            if (!arr) {
                arr = [];
                this.#localSubscriptions.set(id, arr)
            }
            arr.push(cb);
            const val = this.#localValues.get(id)
            if (val) {
                cb(id, val);
            }
        } else
            return this.connection.subscribeState(id, cb);
    }

    unsubscribeState(id: string, cb: ioBroker.StateChangeHandler): void {
        if (id.startsWith('local_')) {
            let arr = this.#localSubscriptions.get(id);
            if (arr) {
                const idx = arr.indexOf(cb);
                if (idx >= 0) {
                    arr.splice(idx, 1);
                }
            }
        } else
            this.connection.unsubscribeState(id, cb);
    }

    public getObjectList(type: ioBroker.ObjectType, id: string) {
        return iobrokerHandler.connection.getObjectView<ioBroker.ObjectType>( id , null, type);
    }

    public getObject(id: string): ioBroker.GetObjectPromise<string> {
        return this.connection.getObject(id);
    }

    public getState(id: string): Promise<State> {
        if (id.startsWith('local_')) {
            return Promise.resolve(this.#localValues.get(id));
        } else
            return this.connection.getState(id);
    }

    public setState(id: string, val: State | StateValue, ack?: boolean): Promise<void> {
        if (id.startsWith('local_')) {
            if (typeof val != 'object') {
                //@ts-ignore
                val = { val: val }
            }
            this.#localValues.set(id, val)
            let arr = this.#localSubscriptions.get(id);
            if (arr) {
                for (let cb of arr)
                    //@ts-ignores
                    cb(id, val)
            }
            return Promise.resolve();
        } else
            return this.connection.setState(id, val, ack);
    }

    private async _getConfig(): Promise<IWebUiConfig> {
        try {
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
        if (this.config.fontDeclarations) {
            this.fontDeclarationsStylesheet = cssFromString(this.config.fontDeclarations);
            document.adoptedStyleSheets = [this.fontDeclarationsStylesheet];
        } else {
            this.fontDeclarationsStylesheet = null;
            document.adoptedStyleSheets = [];
        }
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

    async sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm' | 'uiConnected' | 'uiChangedView', data?: string): Promise<void> {
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
                    this.#cache.get('screen').clear();
                    this.#cache.get('control').clear();
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
window.IOB = iobrokerHandler;