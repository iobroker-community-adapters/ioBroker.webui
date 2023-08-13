import { AdapterInstance } from '@iobroker/adapter-core';
export declare class Uploadhelper {
    private _adapter;
    private _adapterName;
    private _stoppingPromise;
    private _lastProgressUpdate;
    private _ignoredFileExtensions;
    private _uploadStateObjectName;
    constructor(adapter: AdapterInstance);
    static upload(adapter: AdapterInstance, sourceDirectory: string, targetDirectory: string): Promise<void>;
    upload(sourceDirectory: string, targetDirectory: string): Promise<void>;
    collectExistingFilesToDelete(dir: any): Promise<{
        filesToDelete: any[];
        dirs: any[];
    }>;
    eraseFiles(files: any): Promise<void>;
    uploadInternal(files: any, sourceDirectory: string, targetDirectory: string): Promise<AdapterInstance<undefined, undefined>>;
    walk(dir: any, _results?: any): any;
}
