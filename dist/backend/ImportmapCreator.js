import path from 'path';
import fs from 'fs/promises';
function removeTrailing(text, char) {
    if (text.endsWith('/'))
        return text.substring(0, text.length - 1);
    return text;
}
/*function removeLeading(text: string, char: string) {
    if (text.startsWith('/'))
        return text.substring(1);
    return text;
}*/
export class ImportmapCreator {
    _packageBaseDirectory;
    _importmapBaseDirectory;
    _nodeModulesBaseDirectory;
    _dependecies = new Map();
    _adapter;
    importMap = { imports: {}, scopes: {} };
    designerServicesCode = '';
    constructor(adapter, packageBaseDirectory, importmapBaseDirectory) {
        this._adapter = adapter;
        this._packageBaseDirectory = packageBaseDirectory;
        this._importmapBaseDirectory = importmapBaseDirectory;
        this._nodeModulesBaseDirectory = path.join(packageBaseDirectory, 'node_modules');
    }
    async parsePackages(reportState) {
        const packageJsonPath = path.join(this._packageBaseDirectory, 'package.json');
        const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJsonObj = await JSON.parse(packageJson);
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                await this.parseNpmPackageInternal(d, reportState);
            }
        }
        let importMapScript = `const importMapWidgets = ` + JSON.stringify(this.importMap, null, 4) + ';\nimportShim.addImportMap(importMapWidgets);';
        await fs.writeFile(path.join(this._packageBaseDirectory, 'importmap.js'), importMapScript);
        let file = `import { ServiceContainer, WebcomponentManifestElementsService, WebcomponentManifestPropertiesService } from "@node-projects/web-component-designer";

        export function registerNpmWidgets(serviceContainer: ServiceContainer) {`;
        file += this.designerServicesCode;
        file += '\n}';
    }
    async parseNpmPackageInternal(pkg, reportState) {
        const basePath = path.join(this._nodeModulesBaseDirectory, pkg);
        const importMapBasePath = path.join(this._importmapBaseDirectory, pkg);
        const packageJsonPath = path.join(basePath, 'package.json');
        if (reportState)
            reportState(pkg + ": loading package.json");
        const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJsonObj = await JSON.parse(packageJson);
        this.addToImportmap(importMapBasePath, packageJsonObj);
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                await this.loadDependency(d, packageJsonObj.dependencies[d]);
            }
        }
        let customElementsPath = basePath + 'custom-elements.json';
        let elementsRootPath = basePath;
        if (packageJsonObj.customElements) {
            customElementsPath = path.join(basePath, removeTrailing(packageJsonObj.customElements, '/'));
            if (customElementsPath.includes('/')) {
                let idx = customElementsPath.lastIndexOf('/');
                elementsRootPath = customElementsPath.substring(0, idx + 1);
            }
        }
        //let webComponentDesignerPath = path.join(basePath, 'web-component-designer.json');
        if (packageJsonObj.webComponentDesigner) {
            //webComponentDesignerPath = path.join(basePath, removeLeading(packageJsonObj.webComponentDesigner, '/'));
        }
        if (reportState)
            reportState(pkg + ": loading custom-elements.json");
        //let customElementsJson;
        //if (await fs.access(customElementsPath,fs.constants.R_OK ))
        let customElementsJson = await fs.readFile(customElementsPath, 'utf-8');
        /*fs.readFile(webComponentDesignerPath, 'utf-8').then(async x => {
                const webComponentDesignerJson = await JSON.parse(x);
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
            
        });*/
        if (customElementsJson) {
            let nm = packageJsonObj.name.replaceAll(' ', '_');
            this.designerServicesCode += `let ${nm} = ${customElementsJson};
    serviceContainer.register('elementsService', new WebcomponentManifestElementsService('${packageJsonObj.name}', '${elementsRootPath}', ${nm});
    serviceContainer.register('propertyService', new WebcomponentManifestPropertiesService('${packageJsonObj.name}', ${nm});`;
            /*;
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
    async loadDependency(dependency, version, reportState) {
        if (this._dependecies.has(dependency))
            return;
        this._dependecies.set(dependency, true);
        if (dependency.startsWith('@types')) {
            console.warn('ignoring wrong dependency: ', dependency);
            return;
        }
        if (reportState)
            reportState(dependency + ": loading dependency: " + dependency);
        const basePath = path.join(this._nodeModulesBaseDirectory, dependency);
        const importMapBasePath = path.join(this._importmapBaseDirectory, dependency);
        const packageJsonPath = path.join(basePath, 'package.json');
        const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJsonObj = await JSON.parse(packageJson);
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                await this.loadDependency(d, packageJsonObj.dependencies[d]);
            }
        }
        this.addToImportmap(importMapBasePath, packageJsonObj);
    }
    async addToImportmap(basePath, packageJsonObj) {
        const map = this.importMap.imports;
        if (!map.hasOwnProperty(packageJsonObj.name)) {
            let mainImport = packageJsonObj.main;
            if (packageJsonObj.module)
                mainImport = packageJsonObj.module;
            if (mainImport) {
                this.importMap.imports[packageJsonObj.name] = './' + path.join(basePath, removeTrailing(mainImport, '/'));
            }
            else {
                this._adapter.log.warn('main is undefined for "' + packageJsonObj.name + '"');
            }
            this.importMap.imports[packageJsonObj.name + '/'] = './' + basePath + '/';
        }
    }
}