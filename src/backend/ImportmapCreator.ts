import path from 'path';
import fs from 'fs/promises';
import type { AdapterInstance } from '@iobroker/adapter-core';

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
    private _importmapBaseDirectory: string;
    private _nodeModulesBaseDirectory: string;
    private _dependecies = new Map<string, boolean>();
    private _adapter: AdapterInstance

    public importMap = { imports: {}, scopes: {} }
    public designerServicesCode = '';
    public designerAddonsCode = '';
    public importFiles: string[] = [];
    public importUndefinedElementFiles: [name: string, import: string][] = [];

    constructor(adapter: AdapterInstance, packageBaseDirectory: string, importmapBaseDirectory: string) {
        this._adapter = adapter;
        this._packageBaseDirectory = packageBaseDirectory;
        this._importmapBaseDirectory = importmapBaseDirectory;
        this._nodeModulesBaseDirectory = path.join(packageBaseDirectory, 'node_modules');
    }

    public async parsePackages(reportState?: (state: string) => void) {
        const packageJsonPath = path.join(this._packageBaseDirectory, 'package.json');
        const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJsonObj = await JSON.parse(packageJson);

        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                await this.parseNpmPackageInternal(d, reportState);
            }
        }

        let importMapScript = `const importMapWidgets = ` + JSON.stringify(this.importMap, null, 4) + ';\nimportShim.addImportMap(importMapWidgets);'
        await fs.writeFile(path.join(this._packageBaseDirectory, 'importmap.js'), importMapScript);

        /* Imports Code for Designer ... */

        let fileConfigWidgets = `import { ServiceContainer, WebcomponentManifestElementsService, WebcomponentManifestPropertiesService } from "@node-projects/web-component-designer";

export function registerNpmWidgets(serviceContainer) {
`
        fileConfigWidgets += this.designerServicesCode;
        fileConfigWidgets += '\n}';
        await fs.writeFile(path.join(this._packageBaseDirectory, 'configWidgets.js'), fileConfigWidgets);

        let fileDesignerAddons = `import { ServiceContainer, WebcomponentManifestElementsService, WebcomponentManifestPropertiesService } from "@node-projects/web-component-designer";

export async function registerDesignerAddons(serviceContainer) {
    let classDefinition;
`
        fileDesignerAddons += this.designerAddonsCode;
        fileDesignerAddons += '\n}';
        await fs.writeFile(path.join(this._packageBaseDirectory, 'designerAddons.js'), fileDesignerAddons);

        let importWidgetFiles = `import observer from "./customElementsObserver";
`;

        importWidgetFiles += this.importFiles.map(x => "import '" + x + "';").join('\n');
        importWidgetFiles += this.importUndefinedElementFiles.map(x => "observer.setCurrentLib('" + x[0] + "');\nimport '" + x[1] + "';").join('\n');
        await fs.writeFile(path.join(this._packageBaseDirectory, 'importWidgetFiles.js'), importWidgetFiles);
    }

    private async parseNpmPackageInternal(pkg: string, reportState?: (state: string) => void) {
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
        let customElementsPathWeb = importMapBasePath + 'custom-elements.json';
        //let elementsRootPath = basePath;
        let elementsRootPathWeb = importMapBasePath;
        if (packageJsonObj.customElements) {
            customElementsPath = path.join(basePath, removeTrailing(packageJsonObj.customElements, '/'));
            customElementsPathWeb = path.join(importMapBasePath, removeTrailing(packageJsonObj.customElements, '/'));
            if (customElementsPath.includes('/')) {
                //let idx = customElementsPath.lastIndexOf('/');
                //elementsRootPath = customElementsPath.substring(0, idx + 1);
                let idx2 = customElementsPathWeb.lastIndexOf('/');
                elementsRootPathWeb = customElementsPathWeb.substring(0, idx2 + 1);
            }
        }
        let webComponentDesignerPath = path.join(basePath, 'web-component-designer.json');
        if (packageJsonObj.webComponentDesigner) {
            webComponentDesignerPath = path.join(basePath, removeLeading(packageJsonObj.webComponentDesigner, '/'));
        }
        if (reportState)
            reportState(pkg + ": loading custom-elements.json");
        //let customElementsJson;
        //if (await fs.access(customElementsPath,fs.constants.R_OK ))
        let customElementsJson = await fs.readFile(customElementsPath, 'utf-8');

        fs.readFile(webComponentDesignerPath, 'utf-8').then(async x => {
            const webComponentDesignerJson = await JSON.parse(x);
            if (webComponentDesignerJson.services) {
                for (let o in webComponentDesignerJson.services) {
                    for (let s of webComponentDesignerJson.services[o]) {
                        if (s.startsWith('./'))
                            s = s.substring(2);
                        this.designerAddonsCode += `    classDefinition = (await importShim('./${path.join(importMapBasePath, s)}')).default;
    serviceContainer.register('${o}', new classDefinition());
`
                    }
                }
            }

        }).catch(_ => { });

        if (customElementsJson) {
            let nm = (<string>packageJsonObj.name).replaceAll(' ', '_').replaceAll('@', '_').replaceAll('-', '_').replaceAll('/', '_').replaceAll('.', '_');
            this.designerServicesCode += `let ${nm} = ${customElementsJson};
    serviceContainer.register('elementsService', new WebcomponentManifestElementsService('${packageJsonObj.name}', './${elementsRootPathWeb}', ${nm}));
    serviceContainer.register('propertyService', new WebcomponentManifestPropertiesService('${packageJsonObj.name}', ${nm}));`

            let manifest = JSON.parse(customElementsJson);
            for (let m of manifest.modules) {
                for (let e of m.exports) {
                    if (e.kind == 'custom-element-definition') {
                        this.importFiles.push('../' + elementsRootPathWeb + removeLeading(e.declaration.module, '/'));
                    }
                }
            }
        }
        else {
            this._adapter.log.warn('npm package: ' + pkg + ' - no custom-elements.json found, only loading javascript module');



            if (packageJsonObj.module) {
                this.importUndefinedElementFiles.push(packageJsonObj.name, packageJsonObj.module);
            } else if (packageJsonObj.main) {
                this.importUndefinedElementFiles.push(packageJsonObj.name, packageJsonObj.main);
            } else {
                console.warn('npm package: ' + pkg + ' - no entry point in package found.');
            }

            /*if (newElements.length > 0) {
                const elementsCfg: IElementsJson = {
                    elements: newElements
                }
                let elService = new PreDefinedElementsService(pkg, elementsCfg)
                serviceContainer.register('elementsService', elService);
                paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);
            }*/
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

    async addToImportmap(basePath: string, packageJsonObj: { name?: string, module?: string, main?: string, exports?: Record<string, string> }) {

        const map = this.importMap.imports;
        if (!map.hasOwnProperty(packageJsonObj.name)) {
            let mainImport = packageJsonObj.main;
            if (packageJsonObj.module)
                mainImport = packageJsonObj.module;
            if (mainImport) {
                this.importMap.imports[packageJsonObj.name] = './' + path.join(basePath, removeTrailing(mainImport, '/'));
            } else {
                this._adapter.log.warn('main is undefined for "' + packageJsonObj.name + '"');
            }
            this.importMap.imports[packageJsonObj.name + '/'] = './' + basePath + '/';
        }
    }
}