import { Connection } from "@iobroker/socket-client";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IScreen } from "../interfaces/IScreen.js";
import { IWebUiConfig } from "../interfaces/IWebUiConfig.js";
import { IControl } from "../interfaces/IControl.js";
import { IGlobalScript } from "../interfaces/IGlobalScript.js";
import type { SignalInformation, VisualizationHandler } from "@node-projects/web-component-designer-visualization-addons";
declare global {
    interface Window {
        iobrokerHost: string;
        iobrokerPort: number;
        iobrokerWebRootUrl: string;
        iobrokerWebuiRootUrl: string;
    }
}
export declare class IobrokerHandler implements VisualizationHandler {
    #private;
    static instance: IobrokerHandler;
    host: ioBroker.HostObject;
    connection: Connection;
    adapterName: string;
    configPath: string;
    namespace: string;
    namespaceFiles: string;
    namespaceWidgets: string;
    imagePrefix: string;
    additionalFilePrefix: string;
    config: IWebUiConfig;
    globalStylesheet: CSSStyleSheet;
    fontDeclarationsStylesheet: CSSStyleSheet;
    globalScriptInstance: IGlobalScript;
    objectsChanged: TypedEvent<{
        type: string;
        name: string;
    }>;
    imagesChanged: TypedEvent<void>;
    additionalFilesChanged: TypedEvent<void>;
    configChanged: TypedEvent<void>;
    changeView: TypedEvent<string>;
    refreshView: TypedEvent<string>;
    _readyPromises: (() => void)[];
    language: string;
    languageChanged: TypedEvent<string>;
    _controlNames: string[];
    readonly clientId: any;
    constructor();
    getNormalizedSignalName(id: string, relativeSignalPath?: string, element?: Element): string;
    waitForReady(): Promise<void>;
    init(): Promise<void>;
    getIconAdapterFoldernames(): Promise<string[]>;
    getAllNames(type: 'screen' | 'control', dir?: string): Promise<string[]>;
    getSubFolders(type: 'screen' | 'control', dir: string): Promise<string[]>;
    getObjectNames(type: 'screen' | 'control', dir: string): Promise<string[]>;
    getWebuiObject<T extends IScreen | IControl>(type: 'screen' | 'control', name: string): Promise<T>;
    private getScreen;
    saveObject(type: 'screen' | 'control', name: string, data: IScreen | IControl): Promise<void>;
    removeObject(type: 'screen' | 'control', name: string): Promise<void>;
    renameObject(type: 'screen' | 'control', oldName: string, newName: string): Promise<void>;
    createFolder(type: 'screen' | 'control', name: string): Promise<void>;
    removeFolder(type: 'screen' | 'control', name: string): Promise<void>;
    loadAllCustomControls(): Promise<void>;
    getCustomControlNames(): Promise<string[]>;
    private getCustomControl;
    getImageNames(): Promise<string[]>;
    saveImage(name: string, imageData: Blob): Promise<void>;
    getImage(name: string): Promise<{
        mimeType: string;
        file: ArrayBuffer;
    }>;
    removeImage(name: string): Promise<void>;
    getAdditionalFileNames(): Promise<string[]>;
    saveAdditionalFile(name: string, data: Blob): Promise<void>;
    getAdditionalFile(name: string): Promise<{
        mimeType: string;
        file: ArrayBuffer;
    }>;
    removeAdditionalFile(name: string): Promise<void>;
    subscribeState(id: string, cb: ioBroker.StateChangeHandler): Promise<void>;
    unsubscribeState(id: string, cb: ioBroker.StateChangeHandler): void;
    getObjectList(type: ioBroker.ObjectType, id: string): Promise<Record<string, ioBroker.AnyObject & {
        type: ioBroker.ObjectType;
    }>>;
    getObject(id: string): ioBroker.GetObjectPromise<string> & Promise<{
        "$type": 'Signal';
    }>;
    getState(id: string): Promise<State>;
    setState(id: string, val: State | StateValue, ack?: boolean): Promise<void>;
    private _getConfig;
    saveConfig(): Promise<void>;
    private _getObjectFromFile;
    private _saveObjectToFile;
    private _saveBinaryToFile;
    sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm' | 'uiConnected' | 'uiChangedView', data?: string): Promise<void>;
    handleCommand(command: "uiReloadPackages" | "uiReload" | "uiRefresh" | "uiChangeView" | "uiChangedView" | "uiOpenDialog" | "uiOpenedDialog" | "uiPlaySound" | "uiRunScript" | "uiAlert", data: string, clientId?: string): Promise<void>;
    getSignalInformation(signal: any): SignalInformation;
    getHistoricData(id: string, config: any): Promise<{
        values: ioBroker.GetHistoryResult;
        sessionId: string;
        stepIgnore: number;
    }>;
}
export declare const iobrokerHandler: IobrokerHandler;
