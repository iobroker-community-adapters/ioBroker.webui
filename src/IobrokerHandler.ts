import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "./interfaces/IScreen";

class IobrokerHandler {

    static instance = new IobrokerHandler();

    host: ioBroker.HostObject;
    connection: Connection;
    adapterName = "webui";
    configPath = "config/";

    private _screens: Record<string, IScreen> = {};
    //private _styles: Record<string, IStyle> = {};
    //private _screenTemplateMap = new WeakMap<IScreen, HTMLTemplateElement>();
    //private _styleSheetMap = new WeakMap<IStyle, CSSStyleSheet>();

    screensChanged = new TypedEvent<void>();
    stylesChanged = new TypedEvent<void>();

    constructor() {
        this.init();
    }

    async init() {
        //this.connection = new Connection({ protocol: 'ws', host: '192.168.1.2', port: 8082, admin5only: false, autoSubscribes: [] });
        this.connection = new Connection({ protocol: 'ws', host: window.location.hostname, port: window.location.port, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        await this.readAllScreens();

        console.log("ioBroker handler ready.")
    }

    async readAllScreens() {
        const screenNames =  (await this.connection.readDir(this.adapterName, this.configPath + "screens")).map(x => x.file);
        const screenPromises = screenNames.map(x => this.connection.readFile(this.adapterName, this.configPath + "screens/" + x, false))
        const screensLoaded = await Promise.all(screenPromises);
        this._screens = {};
        screenNames.forEach((x, i) => this._screens[x.toLocaleLowerCase()] = JSON.parse(atob(screensLoaded[i].file)));
        this.screensChanged.emit();
    }

    async saveScreen(name: string, screen: IScreen) {
        await this.connection.writeFile64(this.adapterName, this.configPath + "screens/" + name.toLocaleLowerCase(), btoa(JSON.stringify(screen)));
        this.readAllScreens();
    }

    getScreenNames() {
        return Object.keys(this._screens);
    }

    getScreen(name: string): IScreen {
        return this._screens[name.toLocaleLowerCase()];
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
}

export const iobrokerHandler = IobrokerHandler.instance;