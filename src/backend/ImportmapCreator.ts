import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import type { AdapterInstance } from '@iobroker/adapter-core';

let skipPackages = ['@node-projects/base-custom-webcomponent', 'tslib', 'long'];

function removeTrailing(text: string, char: string) {
    if (text.endsWith(char ?? '/'))
        return text.substring(0, text.length - 1);
    return text;
}

function removeLeading(text: string, char: string) {
    if (text.startsWith(char ?? '/'))
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
                try {
                    if (!skipPackages.includes(d)) {
                        await this.parseNpmPackageInternal(d, reportState);
                    }
                }
                catch (err) {
                    this._adapter.log.warn("Error Parsing Package: " + d + " - error: " + err)
                }
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

        let importWidgetFiles = `import observer from "/webui/dist/frontend/widgets/customElementsObserver.js";
`;

        importWidgetFiles += this.importFiles.map(x => "try {\nawait import('" + x + "');\n}catch (err) { console.error('error during import of ' + x, err); }\n").join('\n');
        importWidgetFiles += '\n\n';
        importWidgetFiles += this.importUndefinedElementFiles.map(x => "observer.setCurrentLib('" + x[0] + "');\nawait import('" + x[1] + "');\nobserver.finishedCurrentLib();").join('\n');
        await fs.writeFile(path.join(this._packageBaseDirectory, 'importWidgetFiles.js'), importWidgetFiles);

        let importWidgetFilesRuntime = '';
        importWidgetFilesRuntime += this.importFiles.map(x => "import('" + x + "').catch(err => console.error('error during import of ' + x, err));").join('\n');
        importWidgetFilesRuntime += '\n\n';
        importWidgetFilesRuntime += this.importUndefinedElementFiles.map(x => "import '" + x[1] + "';").join('\n');
        await fs.writeFile(path.join(this._packageBaseDirectory, 'importWidgetFilesRuntime.js'), importWidgetFilesRuntime);
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
                if (!skipPackages.includes(d)) {
                    await this.loadDependency(d, packageJsonObj.dependencies[d]);
                }
            }
        }
        let customElementsPath = basePath + '/custom-elements.json';
        let customElementsPathWeb = importMapBasePath + '/custom-elements.json';
        let elementsRootPathWeb = importMapBasePath;
        if (packageJsonObj.customElements) {
            customElementsPath = path.join(basePath, removeTrailing(packageJsonObj.customElements, '/'));
            customElementsPathWeb = path.join(importMapBasePath, removeTrailing(packageJsonObj.customElements, '/'));
            if (customElementsPath.includes('/')) {
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
        let customElementsJson = null;
        if (fsSync.existsSync(customElementsPath))
            customElementsJson = await fs.readFile(customElementsPath, 'utf-8');

        fs.readFile(webComponentDesignerPath, 'utf-8').then(async x => {
            const webComponentDesignerJson = await JSON.parse(x);
            if (webComponentDesignerJson.services) {
                for (let o in webComponentDesignerJson.services) {
                    for (let s of webComponentDesignerJson.services[o]) {
                        if (s.startsWith('./'))
                            s = s.substring(2);
                        this.designerAddonsCode += `    classDefinition = (await importShim('${path.join(importMapBasePath, s)}')).default;
    serviceContainer.register('${o}', new classDefinition());
`
                    }
                }
            }

        }).catch(_ => { });

        if (customElementsJson) {
            let nm = (<string>packageJsonObj.name).replaceAll(' ', '_').replaceAll('@', '_').replaceAll('-', '_').replaceAll('/', '_').replaceAll('.', '_');
            this.designerServicesCode += `let ${nm} = ${customElementsJson};
    serviceContainer.register('elementsService', new WebcomponentManifestElementsService('${packageJsonObj.name}', '${elementsRootPathWeb}', ${nm}));
    serviceContainer.register('propertyService', new WebcomponentManifestPropertiesService('${packageJsonObj.name}', ${nm}));`

            let manifest = JSON.parse(customElementsJson);
            for (let m of manifest.modules) {
                for (let e of m.exports) {
                    if (e.kind == 'custom-element-definition') {
                        this.importFiles.push(elementsRootPathWeb + removeLeading(e.declaration.module, '/'));
                    }
                }
            }
        }
        else {
            this._adapter.log.warn('npm package: ' + pkg + ' - no custom-elements.json found, only loading javascript module');
            if (packageJsonObj.module) {
                this.importUndefinedElementFiles.push([packageJsonObj.name, elementsRootPathWeb + "/" + removeLeading(packageJsonObj.module, '/')]);
            } else if (packageJsonObj.main) {
                this.importUndefinedElementFiles.push([packageJsonObj.name, elementsRootPathWeb + "/" + removeLeading(packageJsonObj.main, '/')]);
            } else if (packageJsonObj.unpkg) {
                this.importUndefinedElementFiles.push([packageJsonObj.name, elementsRootPathWeb + "/" + removeLeading(packageJsonObj.unpkg, '/')]);
            } else {
                console.warn('npm package: ' + pkg + ' - no entry point in package found.');
            }
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

    async addToImportmap(basePath: string, packageJsonObj: { name?: string, module?: string, main?: string, unpkg?: string, exports?: Record<string, string> }) {
        const map = this.importMap.imports;
        if (!map.hasOwnProperty(packageJsonObj.name)) {
            if (packageJsonObj.exports) {
                let getImport = (obj: any) => {
                    if (obj?.browser)
                        return obj.browser;
                    if (obj?.import)
                        return obj.import;
                    if (obj?.module)
                        return obj.module;
                    if (obj?.default)
                        return obj.default;
                    return obj?.node;
                }
                let getImportFlat = (obj: any) => {
                    let i = getImport(obj);
                    if (!(typeof i == 'string'))
                        i = getImport(i);
                    if (!(typeof i == 'string'))
                        i = getImport(i);
                    if (!(typeof i == 'string'))
                        i = null;
                    return i;
                }
                let imp = getImportFlat(packageJsonObj.exports);
                if (imp) {
                    this.importMap.imports[packageJsonObj.name] = basePath + removeLeading(removeTrailing(imp, '/'), '.');
                } else if (imp = getImportFlat(packageJsonObj.exports?.['.'])) {
                    this.importMap.imports[packageJsonObj.name] = basePath + removeLeading(removeTrailing(imp, '/'), '.');
                }
            }

            let mainImport = packageJsonObj.main;
            if (packageJsonObj.module)
                mainImport = packageJsonObj.module;
            if (packageJsonObj.unpkg && !mainImport)
                mainImport = packageJsonObj.unpkg;
            if (mainImport) {
                if (!this.importMap.imports[packageJsonObj.name])
                    this.importMap.imports[packageJsonObj.name] = path.join(basePath, removeTrailing(mainImport, '/'));
            } else {
                this._adapter.log.warn('main is undefined for "' + packageJsonObj.name + '"');
            }
            this.importMap.imports[packageJsonObj.name + '/'] = basePath + '/';
        }
    }
}