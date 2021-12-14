import { AdminConnection } from "@iobroker/socket-client";
import { SocketClient } from "./Socket";

class IobrokerHandler {

    host: ioBroker.HostObject;
    adminConnection: AdminConnection;
    adapterName = "webui";

    constructor() {

    }

    async init() {
        //@ts-ignore
        window.io = new SocketClient();
        //@ts-ignore
        this.adminConnection = new AdminConnection({ protocol: 'http', host: '192.168.1.2', port: 8081, admin5only: true, autoSubscribes: [] });
        await this.adminConnection.startSocket();
        await this.adminConnection.waitForFirstConnection();

        this.host = await this.adminConnection.getHosts()[0];
    }

    async getScreens() {
        const screens = await this.adminConnection.readDir(this.adapterName, "screens");
        return screens.map(x => x.file);
    }

    async getScreen(name: string) {
        const screen = await this.adminConnection.readFile(this.adapterName, "screens/" + name);
        return screen.file;
    }

    async saveScreens(name: string, content: string) {
        await this.adminConnection.writeFile64(this.adapterName, "screens/" + name, content);
    }
}

let handler = new IobrokerHandler();
await handler.init();
window.iobrokerHandler = handler;

declare global {
    interface Window {
        iobrokerHandler: IobrokerHandler;
    }
}