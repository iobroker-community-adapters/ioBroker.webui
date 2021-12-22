/// <reference types="iobroker" />
import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "./interfaces/IScreen";
declare class IobrokerHandler {
    static instance: IobrokerHandler;
    host: ioBroker.HostObject;
    connection: Connection;
    adapterName: string;
    configPath: string;
    private _screens;
    screensChanged: TypedEvent<void>;
    stylesChanged: TypedEvent<void>;
    constructor();
    init(): Promise<void>;
    readAllScreens(): Promise<void>;
    saveScreen(name: string, screen: IScreen): Promise<void>;
    getScreenNames(): string[];
    getScreen(name: string): IScreen;
}
export declare const iobrokerHandler: IobrokerHandler;
export {};
