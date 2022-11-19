import { Connection } from '/webui/node_modules/@iobroker/socket-client/dist/esm/index.js';
import { TypedEvent } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
class IobrokerHandler {
    static instance = new IobrokerHandler();
    host;
    connection;
    adapterName = "webui";
    configPath = "config/";
    namespace = "webui.0";
    _screens = {};
    //private _styles: Record<string, IStyle> = {};
    //private _screenTemplateMap = new WeakMap<IScreen, HTMLTemplateElement>();
    //private _styleSheetMap = new WeakMap<IStyle, CSSStyleSheet>();
    screensChanged = new TypedEvent();
    stylesChanged = new TypedEvent();
    constructor() {
    }
    async init() {
        this.connection = new Connection({ protocol: 'ws', host: window.iobrokerHost, port: window.iobrokerPort, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        await this.readAllScreens();
        console.log("ioBroker handler ready.");
    }
    async readAllScreens() {
        const screenNames = (await this.connection.readDir(this.adapterName, this.configPath + "screens")).map(x => x.file);
        const screenPromises = screenNames.map(x => this.connection.readFile(this.adapterName, this.configPath + "screens/" + x, false));
        const screensLoaded = await Promise.all(screenPromises);
        this._screens = {};
        screenNames.forEach((x, i) => this._screens[x.toLocaleLowerCase()] = JSON.parse(atob(screensLoaded[i].file)));
        this.screensChanged.emit();
    }
    async saveScreen(name, screen) {
        await this.connection.writeFile64(this.adapterName, this.configPath + "screens/" + name.toLocaleLowerCase(), btoa(JSON.stringify(screen)));
        this.readAllScreens();
    }
    getScreenNames() {
        return Object.keys(this._screens);
    }
    getScreen(name) {
        return this._screens[name.toLocaleLowerCase()];
    }
    async sendCommand(command, data, clientId = '') {
        await this.connection.setState(this.namespace + '.control.data', { val: data });
        await this.connection.setState(this.namespace + '.control.clientIds', { val: clientId });
        await this.connection.setState(this.namespace + '.control.command', { val: command });
    }
    /*async readAllStyles() {
        const styleNames = (await this.connection.readDir(this.adapterName, this.configPath + "styles")).map(x => x.file);
        const stylePromises = styleNames.map(x => this.connection.readFile(this.adapterName, this.configPath + "styles/" + x))
        const stylesLoaded = await Promise.all(stylePromises);
        this._styles = {};
        styleNames.forEach((x, i) => this._styles[x.toLocaleLowerCase()] = JSON.parse(stylesLoaded[i].file));
        this.screensChanged.emit();
    }

    async saveStyle(name: string, style: IStyle) {
        await this.connection.writeFile64(this.adapterName, this.configPath + "styles/" + name.toLocaleLowerCase(), btoa(JSON.stringify(style)));
        this.readAllStyles();
    }

    getStyleNames() {
        return Object.keys(this._styles);
    }

    getStyle(name: string): IStyle {
        return this._styles[name.toLocaleLowerCase()];
    }*/
    //todod: remove when https://github.com/ioBroker/socket-client/pull/17 is merged
    /**
     * Query a predefined object view.
     * @param design design - 'system' or other designs like `custom`.
     * @param type The type of object.
     * @param start The start ID.
     * @param [end] The end ID.
     */
    getObjectViewCustom(design, type, start, end) {
        //@ts-ignore
        return this.connection.request({
            // TODO: check if this should time out
            commandTimeout: false,
            executor: (resolve, reject) => {
                start = start || "";
                end = end || "\u9999";
                //@ts-ignore
                this.connection._socket.emit("getObjectView", design, type, { startkey: start, endkey: end }, (err, res) => {
                    if (err)
                        reject(err);
                    const _res = {};
                    //@ts-ignore
                    if (res && res.rows) {
                        //@ts-ignore
                        for (let i = 0; i < res.rows.length; i++) {
                            //@ts-ignore
                            _res[res.rows[i].id] = res.rows[i].value;
                        }
                    }
                    resolve(_res);
                });
            },
        });
    }
}
export const iobrokerHandler = IobrokerHandler.instance;
