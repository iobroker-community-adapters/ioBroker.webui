import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "../interfaces/IScreen.js";
import { IWebUiConfig } from "../interfaces/IWebUiConfig.js";
import { IControl } from "../interfaces/IControl.js";
import { IGlobalScript } from "../interfaces/IGlobalScript.js";
export type StateValue = string | number | boolean | null;
export interface State {
    /** The value of the state. */
    val: StateValue;
    /** Direction flag: false for desired value and true for actual value. Default: false. */
    ack: boolean;
    /** Unix timestamp. Default: current time */
    ts: number;
    /** Unix timestamp of the last time the value changed */
    lc: number;
    /** Name of the adapter instance which set the value, e.g. "system.adapter.web.0" */
    from: string;
    /** The user who set this value */
    user?: string;
    /** Optional time in seconds after which the state is reset to null */
    expire?: number;
    /** Optional quality of the state value */
    q?: number;
    /** Optional comment */
    c?: string;
}
declare global {
    interface Window {
        iobrokerHost: string;
        iobrokerPort: number;
        iobrokerWebRootUrl: string;
        iobrokerWebuiRootUrl: string;
    }
}
declare class IobrokerHandler {
    static instance: IobrokerHandler;
    host: ioBroker.HostObject;
    connection: Connection;
    adapterName: string;
    configPath: string;
    namespace: string;
    namespaceFiles: string;
    namespaceWidgets: string;
    imagePrefix: string;
    config: IWebUiConfig;
    globalStylesheet: CSSStyleSheet;
    globalScriptInstance: IGlobalScript;
    screensChanged: TypedEvent<string>;
    controlsChanged: TypedEvent<string>;
    imagesChanged: TypedEvent<void>;
    configChanged: TypedEvent<void>;
    changeView: TypedEvent<string>;
    refreshView: TypedEvent<string>;
    _readyPromises: (() => void)[];
    language: string;
    languageChanged: TypedEvent<string>;
    readonly clientId: any;
    constructor();
    waitForReady(): Promise<void>;
    init(): Promise<void>;
    private _screenNames;
    private _screens;
    getIconAdapterFoldernames(): Promise<string[]>;
    loadAllScreens(): Promise<void>;
    getScreenNames(): Promise<string[]>;
    getScreen(name: string): Promise<IScreen>;
    saveScreen(name: string, screen: IScreen): Promise<void>;
    removeScreen(name: string): Promise<void>;
    renameScreen(oldName: string, newName: string): Promise<void>;
    private _controlNames;
    private _controls;
    loadAllCustomControls(): Promise<void>;
    getCustomControlNames(): Promise<string[]>;
    getCustomControl(name: string): Promise<IControl>;
    saveCustomControl(name: string, control: IControl): Promise<void>;
    removeCustomControl(name: string): Promise<void>;
    renameCustomControl(oldName: string, newName: string): Promise<void>;
    getImageNames(): Promise<string[]>;
    saveImage(name: string, imageData: Blob): Promise<void>;
    getImage(name: string): Promise<{
        mimType: string;
        file: ArrayBuffer;
    }>;
    removeImage(name: string): Promise<void>;
    private _getConfig;
    saveConfig(): Promise<void>;
    private _getObjectFromFile;
    private _saveObjectToFile;
    private _saveBinaryToFile;
    getState(id: string): Promise<State>;
    setState(id: string, val: State | StateValue, ack?: boolean): Promise<void>;
    sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm' | 'uiConnected' | 'uiChangedView', data: string): Promise<void>;
    handleCommand(command: "uiReloadPackages" | "uiReload" | "uiRefresh" | "uiChangeView" | "uiChangedView" | "uiOpenDialog" | "uiOpenedDialog" | "uiPlaySound" | "uiRunScript" | "uiAlert", data: string, clientId?: string): Promise<void>;
}
export declare const iobrokerHandler: IobrokerHandler;
export {};
