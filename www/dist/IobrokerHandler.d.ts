/// <reference types="iobroker" />
import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
declare class IobrokerHandler {
    static instance: IobrokerHandler;
    host: ioBroker.HostObject;
    connection: Connection;
    adapterName: string;
    private _screens;
    screensChanged: TypedEvent<void>;
    constructor();
    init(): Promise<void>;
    readAllScreens(): Promise<void>;
    saveScreen(name: string, content: string): Promise<void>;
    getScreenNames(): string[];
    getScreen(name: string): string;
}
export declare const iobrokerHandler: IobrokerHandler;
export {};
