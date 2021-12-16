import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { socketIoFork } from "./SocketIoFork";

class IobrokerHandler {

    static instance = new IobrokerHandler();

    host: ioBroker.HostObject;
    adminConnection: Connection;
    adapterName = "webui";

    private _screens: string[] = [];

    screensChanged = new TypedEvent<void>();

    constructor() {
        this.init();
    }

    async init() {
        //@ts-ignore
        window.io = socketIoFork;
        //@ts-ignore
        this.adminConnection = new Connection({ protocol: 'ws', host: '192.168.1.2', port: 8081, admin5only: false, autoSubscribes: [] });
        await this.adminConnection.startSocket();
        await this.adminConnection.waitForFirstConnection();

        //this.host = await this.adminConnection.getHosts()[0];
        await this.readAllScreens();

        console.log("ioBroker handler ready.")
    }

    async readAllScreens() {
        const screenNames = await (await this.adminConnection.readDir(this.adapterName, "screens")).map(x => x.file);
        const screenPromises = screenNames.map(x => this.adminConnection.readFile(this.adapterName, "screens/" + x))
        const screensLoaded = await Promise.all(screenPromises);
        this._screens = [];
        screenNames.map((x, i) => this._screens[x.toLocaleLowerCase()] = screensLoaded[i].file);
        this.screensChanged.emit();
    }

    async saveScreen(name: string, content: string) {
        await this.adminConnection.writeFile64(this.adapterName, "screens/" + name.toLocaleLowerCase(), btoa(content));
        this.readAllScreens();
    }

    getScreenNames() {
        return Object.keys(this._screens);
    }

    getScreen(name: string): string {
        return this._screens[name.toLocaleLowerCase()];
    }
}

export const iobrokerHandler = IobrokerHandler.instance;