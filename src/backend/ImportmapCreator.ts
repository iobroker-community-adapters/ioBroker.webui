import path from 'path';
//import fs from 'fs/promises';

function removeTrailing(text: string, char: string) {
    if (text.endsWith('/'))
        return text.substring(0, text.length - 1);
    return text;
}

function removeLeading(text: string, char: string) {
    if (text.startsWith('/'))
        return text.substring(1);
    return text;
}

export class ImportmapCreator {

    private _packageBaseDirectory: string;
    private _dependecies = new Map<string, boolean>();

    public importMap = { imports: {}, scopes: {} }

    constructor(packageBaseDirectory: string) {
        this._packageBaseDirectory = packageBaseDirectory;
    }

    async parseNpmPackage(pkg: string, /*loadAllImports: boolean,*/ reportState?: (state: string) => void) {
        const basePath = path.join(this._packageBaseDirectory, pkg);

        const packageJsonPath = path.join(basePath, 'package.json');
        if (reportState)
            reportState(pkg + ": loading package.json");
        const packageJson = await fetch(packageJsonPath);
        const packageJsonObj = await packageJson.json();

        this.addToImportmap(basePath, packageJsonObj);

        const depPromises: Promise<void>[] = []
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                depPromises.push(this.loadDependency(d, packageJsonObj.dependencies[d]));
            }
        }
        await Promise.all(depPromises)
        let customElementsPath = basePath + 'custom-elements.json';
        //let elementsRootPath = basePath;
        if (packageJsonObj.customElements) {
            customElementsPath = basePath + removeTrailing(packageJsonObj.customElements, '/');
            if (customElementsPath.includes('/')) {
                //let idx = customElementsPath.lastIndexOf('/');
                //elementsRootPath = customElementsPath.substring(0, idx + 1);
            }
        }
        let webComponentDesignerPath = basePath + 'web-component-designer.json';
        if (packageJsonObj.webComponentDesigner) {
            webComponentDesignerPath = basePath + removeLeading(packageJsonObj.webComponentDesigner, '/');
        }
        if (reportState)
            reportState(pkg + ": loading custom-elements.json");
        let customElementsJson = await fetch(customElementsPath);

        fetch(webComponentDesignerPath).then(async x => {
            if (x.ok) {
                const webComponentDesignerJson = await x.json();
                if (webComponentDesignerJson.services) {
                    for (let o in webComponentDesignerJson.services) {
                        for (let s of webComponentDesignerJson.services[o]) {
                            if (s.startsWith('./'))
                                s = s.substring(2);
                            //@ts-ignore
                            const classDefinition = (await importShim(basePath + s)).default;
                            //@ts-ignore
                            serviceContainer.register(o, new classDefinition());
                        }
                    }
                }
            }
        });

        if (customElementsJson.ok) {
            /*const customElementsJsonObj = await customElementsJson.json();
            let elements = new WebcomponentManifestElementsService(packageJsonObj.name, elementsRootPath, customElementsJsonObj);
            serviceContainer.register('elementsService', elements);
            let properties = new WebcomponentManifestPropertiesService(packageJsonObj.name, customElementsJsonObj);
            serviceContainer.register('propertyService', properties);

            if (loadAllImports) {
                for (let e of await elements.getElements()) {
                    //@ts-ignore
                    importShim(e.import);
                }
            }

            //todo: should be retriggered by service container, or changeing list in container
            paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);*/
        }
        else {
            /*console.warn('npm package: ' + pkg + ' - no custom-elements.json found, only loading javascript module');

            let customElementsRegistry = window.customElements;
            const registry: any = {};
            const newElements: string[] = [];
            registry.define = function (name, constructor, options) {
                newElements.push(name);
                customElementsRegistry.define(name, constructor, options);
            }
            registry.get = function (name) {
                return customElementsRegistry.get(name);
            }
            registry.upgrade = function (node) {
                return customElementsRegistry.upgrade(node);
            }
            registry.whenDefined = function (name) {
                return customElementsRegistry.whenDefined(name);
            }

            Object.defineProperty(window, "customElements", {
                get() {
                    return registry
                }
            });

            if (packageJsonObj.module) {
                //@ts-ignore
                await importShim(basePath + removeLeading(packageJsonObj.module, '/'))
            } else if (packageJsonObj.main) {
                //@ts-ignore
                await importShim(basePath + removeLeading(packageJsonObj.main, '/'))
            } else if (packageJsonObj.unpkg) {
                //@ts-ignore
                await importShim(basePath + removeLeading(packageJsonObj.unpkg, '/'))
            } else {
                console.warn('npm package: ' + pkg + ' - no entry point in package found.');
            }

            if (newElements.length > 0) {
                const elementsCfg: IElementsJson = {
                    elements: newElements
                }
                let elService = new PreDefinedElementsService(pkg, elementsCfg)
                serviceContainer.register('elementsService', elService);
                paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);
            }

            Object.defineProperty(window, "customElements", {
                get() {
                    return customElementsRegistry
                }
            }); */

        }
        if (reportState)
            reportState(pkg + ": done");
    }

    async loadDependency(dependency: string, version?: string, reportState?: (state: string) => void) {
        if (this._dependecies.has(dependency))
            return;

        this._dependecies.set(dependency, true);

        if (dependency.startsWith('@types')) {
            console.warn('ignoring wrong dependency: ', dependency);
            return;
        }
        if (reportState)
            reportState(dependency + ": loading dependency: " + dependency);
        const basePath = this._packageBaseDirectory + dependency + '/';

        const packageJsonPath = basePath + 'package.json';
        const packageJson = await fetch(packageJsonPath);
        const packageJsonObj = await packageJson.json();

        const depPromises: Promise<void>[] = []
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                depPromises.push(this.loadDependency(d, packageJsonObj.dependencies[d]));
            }
        }
        await Promise.all(depPromises)

        this.addToImportmap(basePath, packageJsonObj);
    }

    async addToImportmap(basePath: string, packageJsonObj: { name?: string, module?: string, main?: string, exports?: Record<string, string> }) {

        const map = this.importMap.imports;
        if (!map.hasOwnProperty(packageJsonObj.name)) {
            let mainImport = packageJsonObj.main;
            if (packageJsonObj.module)
                mainImport = packageJsonObj.module;
            this.importMap.imports[packageJsonObj.name] = basePath + removeTrailing(mainImport, '/');
            this.importMap.imports[packageJsonObj.name + '/'] = basePath;
        }
    }
}