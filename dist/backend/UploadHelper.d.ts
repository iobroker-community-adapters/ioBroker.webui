import { AdapterInstance } from '@iobroker/adapter-core';
export declare function sleep(ms: any): Promise<unknown>;
export declare class Uploadhelper {
    private _adapter;
    private _stoppingPromise;
    private _lastProgressUpdate;
    private _namespace;
    _stateNpm: string;
    private _ignoredFileExtensions;
    constructor(adapter: AdapterInstance, namespace: string);
    static upload(adapter: AdapterInstance, namespace: string, sourceDirectory: string, targetDirectory: string): Promise<void>;
    upload(sourceDirectory: string, targetDirectory: string): Promise<void>;
    collectExistingFilesToDelete(dir: any): Promise<{
        filesToDelete: any[];
        dirs: any[];
    }>;
    eraseFiles(files: any): Promise<void>;
    uploadInternal(files: any, sourceDirectory: string, targetDirectory: string): Promise<void>;
    _uploadFile(sourceFile: string, destinationFile: string): Promise<void>;
    walk(dir: any, _results?: any): any;
}
