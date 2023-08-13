export declare class ImportmapCreator {
    private _packageBaseDirectory;
    private _nodeModulesBaseDirectory;
    private _dependecies;
    importMap: {
        imports: {};
        scopes: {};
    };
    constructor(packageBaseDirectory: string);
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
