import utils from '@iobroker/adapter-core';
declare class WebUi extends utils.Adapter {
    _unloaded: boolean;
    _instanceName: string;
    _npmNamespace: string;
    _dataNamespace: string;
    _stateNpm: string;
    _stateCommand: string;
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options?: any);
    runUpload(): Promise<void>;
    refreshWWW(): Promise<void>;
    widgetsDir: string;
    npmRunning: boolean;
    creatWidgetsDirAndRestorePackageJsonIfneeded(): Promise<void>;
    backupPackageJson(): Promise<void>;
    checkPackageName(name: string): boolean;
    installNpm(name: any): Promise<unknown>;
    removeNpm(name: any): Promise<unknown>;
    states: {};
    stateChange(id: any, state: any): Promise<void>;
    createImportMapAndLoaderFiles(): Promise<void>;
    runCommand(command: any, parameter: any): Promise<void>;
    main(): Promise<void>;
    onUnload(): void;
}
export default function startAdapter(options: Partial<utils.AdapterOptions> | undefined): WebUi;
export {};
