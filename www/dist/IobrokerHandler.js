import { Connection } from '/webui/node_modules/@iobroker/socket-client/dist/esm/index.js';
import { TypedEvent } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
class IobrokerHandler {
    constructor() {
        this.adapterName = "webui";
        this.configPath = "config/";
        this._screens = {};
        this._styles = {};
        //private _screenTemplateMap = new WeakMap<IScreen, HTMLTemplateElement>();
        //private _styleSheetMap = new WeakMap<IStyle, CSSStyleSheet>();
        this.screensChanged = new TypedEvent();
        this.stylesChanged = new TypedEvent();
        this.init();
    }
    async init() {
        //this.connection = new Connection({ protocol: 'ws', host: '192.168.1.2', port: 8082, admin5only: false, autoSubscribes: [] });
        this.connection = new Connection({ protocol: 'ws', host: window.location.hostname, port: window.location.port, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        await this.readAllScreens();
        await this.readAllStyles();
        console.log("ioBroker handler ready.");
    }
    async readAllScreens() {
        const screenNames = await (await this.connection.readDir(this.adapterName, this.configPath + "screens")).map(x => x.file);
        const screenPromises = screenNames.map(x => this.connection.readFile(this.adapterName, this.configPath + "screens/" + x, false));
        const screensLoaded = await Promise.all(screenPromises);
        this._screens = {};
        screenNames.map((x, i) => this._screens[x.toLocaleLowerCase()] = JSON.parse(atob(screensLoaded[i].file)));
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
    async readAllStyles() {
        const styleNames = await (await this.connection.readDir(this.adapterName, this.configPath + "styles")).map(x => x.file);
        const stylePromises = styleNames.map(x => this.connection.readFile(this.adapterName, this.configPath + "styles/" + x));
        const stylesLoaded = await Promise.all(stylePromises);
        this._styles = {};
        styleNames.map((x, i) => this._styles[x.toLocaleLowerCase()] = JSON.parse(stylesLoaded[i].file));
        this.screensChanged.emit();
    }
    async saveStyle(name, style) {
        await this.connection.writeFile64(this.adapterName, this.configPath + "styles/" + name.toLocaleLowerCase(), btoa(JSON.stringify(style)));
        this.readAllStyles();
    }
    getStyleNames() {
        return Object.keys(this._styles);
    }
    getStyle(name) {
        return this._styles[name.toLocaleLowerCase()];
    }
}
IobrokerHandler.instance = new IobrokerHandler();
export const iobrokerHandler = IobrokerHandler.instance;
