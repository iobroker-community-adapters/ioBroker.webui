import { AdapterInstance } from '@iobroker/adapter-core';
export declare class Uploadhelper {
    private _adapter;
    private _adapterName;
    private _stoppingPromise;
    private _lastProgressUpdate;
    private _ignoredFileExtensions;
    private _uploadStateObjectName;
    constructor(adapter: AdapterInstance);
    static upload(adapter: AdapterInstance, dir: string): Promise<void>;
    upload(dir: string): Promise<void>;
    collectExistingFilesToDelete(path: any): Promise<{
        filesToDelete: any[];
        dirs: any[];
    }>;
    eraseFiles(files: any): Promise<void>;
    uploadInternal(files: any): Promise<AdapterInstance<undefined, undefined>>;
    walk(dir: any, _results?: any): any;
}
