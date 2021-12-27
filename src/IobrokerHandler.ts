import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "./interfaces/IScreen";
import { IWidgetConfig } from "./interfaces/IWidgetConfig";

declare global {
    interface Window {
        iobrokerHost: string;
        iobrokerPort: number;
        iobrokerWebuiRootUrl: string;
    }
}

class IobrokerHandler {

    static instance = new IobrokerHandler();

    host: ioBroker.HostObject;
    connection: Connection;
    adapterName = "webui";
    configPath = "config/";

    namespace = "webui.0";

    private _screens: Record<string, IScreen> = {};
    //private _styles: Record<string, IStyle> = {};
    //private _screenTemplateMap = new WeakMap<IScreen, HTMLTemplateElement>();
    //private _styleSheetMap = new WeakMap<IStyle, CSSStyleSheet>();

    screensChanged = new TypedEvent<void>();
    stylesChanged = new TypedEvent<void>();

    constructor() {
    }

    async init() {
        //this.loadWidgets();

        this.connection = new Connection({ protocol: 'ws', host: window.iobrokerHost, port: window.iobrokerPort, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        await this.readAllScreens();

        console.log("ioBroker handler ready.")
    }

    async loadWidgets() {
        //@ts-ignore
        const widgetsConfig: IWidgetConfig = (await import(window.iobrokerWebuiRootUrl + "webui-widgets/config.json", { assert: { type: 'json' } })).default;
        for (let name of Object.keys(widgetsConfig)) {
            const w = widgetsConfig[name];
            for (let i of w.imports) {
                import(window.iobrokerWebuiRootUrl + "webui-widgets/" + i);
            }
        }
    }

    async readAllScreens() {
        const screenNames = (await this.connection.readDir(this.adapterName, this.configPath + "screens")).map(x => x.file);
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

    async sendCommand(command: 'addNpm'|'removeNpm', data: string): Promise<void> {
        await this.connection.setState(this.namespace + '.control.data', { val: data });
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
}

export const iobrokerHandler = IobrokerHandler.instance;