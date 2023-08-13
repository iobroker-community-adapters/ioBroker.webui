import type { AdapterInstance } from '@iobroker/adapter-core';
export declare class ImportmapCreator {
    private _packageBaseDirectory;
    private _importmapBaseDirectory;
    private _nodeModulesBaseDirectory;
    private _dependecies;
    private _adapter;
    importMap: {
        imports: {};
        scopes: {};
    };
    designerServicesCode: string;
    designerAddonsCode: string;
    importFiles: string[];
    constructor(adapter: AdapterInstance, packageBaseDirectory: string, importmapBaseDirectory: string);
    parsePackages(reportState?: (state: string) => void): Promise<void>;
    private parseNpmPackageInternal;
    loadDependency(dependency: string, version?: string, reportState?: (state: string) => void): Promise<void>;
    addToImportmap(basePath: string, packageJsonObj: {
        name?: string;
        module?: string;
        main?: string;
        exports?: Record<string, string>;
    }): Promise<void>;
}
