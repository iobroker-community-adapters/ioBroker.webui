import { Connection } from '/webui/node_modules/@iobroker/socket-client/dist/esm/index.js';
import { TypedEvent } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
class IobrokerHandler {
    static instance = new IobrokerHandler();
    host;
    connection;
    adapterName = "webui";
    configPath = "config/";
    _screens = {};
    //private _styles: Record<string, IStyle> = {};
    //private _screenTemplateMap = new WeakMap<IScreen, HTMLTemplateElement>();
    //private _styleSheetMap = new WeakMap<IStyle, CSSStyleSheet>();
    screensChanged = new TypedEvent();
    stylesChanged = new TypedEvent();
    constructor() {
    }
    async init() {
        //this.loadWidgets();
        this.connection = new Connection({ protocol: 'ws', host: window.iobrokerHost, port: window.iobrokerPort, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        await this.readAllScreens();
        console.log("ioBroker handler ready.");
    }
    async loadWidgets() {
        //@ts-ignore
        const widgetsConfig = (await import(window.iobrokerWebuiRootUrl + "webui-widgets/config.json", { assert: { type: 'json' } })).default;
        for (let name of Object.keys(widgetsConfig)) {
            const w = widgetsConfig[name];
            for (let i of w.imports) {
                import(window.iobrokerWebuiRootUrl + "webui-widgets/" + i);
            }
        }
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
}
export const iobrokerHandler = IobrokerHandler.instance;
