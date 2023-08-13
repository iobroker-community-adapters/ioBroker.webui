export declare class ImportmapCreator {
    private _packageBaseDirectory;
    private _dependecies;
    importMap: {
        imports: {};
        scopes: {};
    };
    constructor(packageBaseDirectory: string);
    parseNpmPackage(pkg: string, /*loadAllImports: boolean,*/ reportState?: (state: string) => void): Promise<void>;
    loadDependency(dependency: string, version?: string, reportState?: (state: string) => void): Promise<void>;
    addToImportmap(basePath: string, packageJsonObj: {
        name?: string;
        module?: string;
        main?: string;
        exports?: Record<string, string>;
    }): Promise<void>;
}
