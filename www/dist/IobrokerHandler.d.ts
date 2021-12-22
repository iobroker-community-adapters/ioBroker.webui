/// <reference types="iobroker" />
import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "./interfaces/IScreen";
import { IStyle } from "./interfaces/IStyle";
declare class IobrokerHandler {
    static instance: IobrokerHandler;
    host: ioBroker.HostObject;
    connection: Connection;
    adapterName: string;
    configPath: string;
    private _screens;
    private _styles;
    screensChanged: TypedEvent<void>;
    stylesChanged: TypedEvent<void>;
    constructor();
    init(): Promise<void>;
    readAllScreens(): Promise<void>;
    saveScreen(name: string, screen: IScreen): Promise<void>;
    getScreenNames(): string[];
    getScreen(name: string): IScreen;
    readAllStyles(): Promise<void>;
    saveStyle(name: string, style: IStyle): Promise<void>;
    getStyleNames(): string[];
    getStyle(name: string): IStyle;
}
export declare const iobrokerHandler: IobrokerHandler;
export {};
