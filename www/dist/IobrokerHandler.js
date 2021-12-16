import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { socketIoFork } from "./SocketIoFork";
class IobrokerHandler {
    constructor() {
        this.adapterName = "webui";
        this._screens = [];
        this.screensChanged = new TypedEvent();
        this.init();
    }
    async init() {
        //@ts-ignore
        window.io = socketIoFork;
        //@ts-ignore
        this.connection = new Connection({ protocol: 'ws', host: '192.168.1.2', port: 8081, admin5only: false, autoSubscribes: [] });
        await this.connection.startSocket();
        await this.connection.waitForFirstConnection();
        //this.host = await this.adminConnection.getHosts()[0];
        await this.readAllScreens();
        console.log("ioBroker handler ready.");
    }
    async readAllScreens() {
        const screenNames = await (await this.connection.readDir(this.adapterName, "screens")).map(x => x.file);
        const screenPromises = screenNames.map(x => this.connection.readFile(this.adapterName, "screens/" + x));
        const screensLoaded = await Promise.all(screenPromises);
        this._screens = [];
        screenNames.map((x, i) => this._screens[x.toLocaleLowerCase()] = screensLoaded[i].file);
        this.screensChanged.emit();
    }
    async saveScreen(name, content) {
        await this.connection.writeFile64(this.adapterName, "screens/" + name.toLocaleLowerCase(), btoa(content));
        this.readAllScreens();
    }
    getScreenNames() {
        return Object.keys(this._screens);
    }
    getScreen(name) {
        return this._screens[name.toLocaleLowerCase()];
    }
}
IobrokerHandler.instance = new IobrokerHandler();
export const iobrokerHandler = IobrokerHandler.instance;
