import { AiAssetCatalog, assetPath, type AssetRequest } from './AiAssetCatalog.js';
import { assetPreview } from './AiAssetPreview.js';
import { componentApi, webuiComponentApi } from './AiComponentApi.js';
import { getCustomControlName } from '../runtime/CustomControls.js';
import { pageItems, textChunk } from './AiDocumentEditing.js';
import { IobrokerWebuiScreenEditor } from '../config/IobrokerWebuiScreenEditor.js';
import { IobrokerWebuiMonacoEditor } from '../config/IobrokerWebuiMonacoEditor.js';
import { PreDefinedElementsService } from '@node-projects/web-component-designer';
import observer from '../widgets/customElementsObserver.js';
import { allowedPackageName, describePackage } from '../npm/PackageCatalog.js';
import { loadInstalledPackages } from '../npm/LoadInstalledPackages.js';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import type { IobrokerWebuiAppShell } from '../config/IobrokerWebuiAppShell.js';
import { sameDocument, type AiWorkspace, type AiProposal, type DocumentType } from './AiTypes.js';

import { objectMetadata } from './AiObjectMetadata.js';

export class AiWorkspaceAdapter implements AiWorkspace {
    private get assets() { return new AiAssetCatalog(iobrokerHandler.connection, iobrokerHandler.namespaceFiles, window.iobrokerWebRootUrl); }
    private elementSnapshot: { key: string; expires: number; promise: Promise<any[]> };
    private readonly objectSnapshots = new Map<string, { expires: number; objects: ReturnType<typeof objectMetadata>[] }>();
    constructor(private readonly shell: IobrokerWebuiAppShell) { }
    async listDocuments(type: DocumentType) {
        return [...new Set([...await iobrokerHandler.getAllNames(type), ...this.shell.getScreenEditors().filter(x => x.documentType === type).map(x => x.name)])].sort();
    }
    async readDocument(type: DocumentType, name: string) {
        const editor = this.shell.getScreenEditors().find(x => x.documentType === type && x.name === name);
        if (editor) return editor.getSnapshot();
        const names = await iobrokerHandler.getAllNames(type);
        if (!names.includes(name)) return null;
        const data = await iobrokerHandler.getWebuiObject(type, name);
        if (!data) throw new Error(`Could not read ${type} ${name}.`);
        return structuredClone(data);
    }
    async applyProposal(proposal: AiProposal) {
        const current = await this.readDocument(proposal.type, proposal.name);
        if (!sameDocument(current, proposal.before)) throw new Error(`${proposal.name} changed after the AI read it. Ask the assistant to read it again and make a new proposal.`);
        const base = current ?? { html: '', style: '', script: '', settings: {}, properties: {} };
        const editor = await this.shell.openScreenEditor(proposal.name, proposal.type, base.html, base.style, base.script, base.settings, base.properties);
        if (!editor) throw new Error('The screen editor did not open.');
        await editor.applyAiSnapshot(proposal.data);
    }
    listWindows() { return this.shell.getAiWindows(); }
    async readWindow(id: string, offset = 0, limit = 12000) {
        const element = this.shell.getAiWindowElement(id);
        if (!element) throw new Error('This window is no longer open.');
        if (element instanceof IobrokerWebuiScreenEditor) return { id, document: { type: element.documentType, name: element.name }, message: 'Use read_document or read_document_field for its authored source and properties.' };
        const code = element instanceof IobrokerWebuiMonacoEditor ? element : element.querySelector<IobrokerWebuiMonacoEditor>('iobroker-webui-monaco-editor');
        if (code) return { id, kind: 'code', language: code.language, ...textChunk(code.model?.getValue() ?? '', offset, limit) };
        return { id, kind: 'tool', message: 'Tool window. Use get_editor_context for its associated document and selection.' };
    }
    async editorContext() {
        const windows = this.shell.getAiWindows();
        const editor = this.shell.getActiveScreenEditor();
        if (!editor) return { currentWindow: windows.find(window => window.current) ?? null, activeWindow: windows.find(window => window.active) ?? null, document: null, selection: [] };
        await editor.documentContainer.commitPendingChanges();
        const instance = editor.documentContainer.instanceServiceContainer;
        const root = editor.documentContainer.editingDocument.rootDesignItem;
        const selection = instance.selectionService.selectedElements.slice(0, 30).map(item => {
            const path: number[] = [];
            let current = item;
            while (current && current !== root && current.parent) {
                const siblings = [...current.parent.children()].filter(child => child.node.nodeType === 1);
                path.unshift(siblings.indexOf(current)); current = current.parent;
            }
            return { tag: item.name, id: item.id, path: current === root && path.length ? path : null, host: item === root,
                attributes: Object.fromEntries([...item.attributes()].filter(([name]) => name !== 'style').slice(0, 30).map(([name, value]) => [name, String(value).slice(0, 1024)])),
                inlineStyles: Object.fromEntries([...item.styles()].slice(0, 30).map(([name, value]) => [name, String(value).slice(0, 512)])), text: String(item.content ?? '').slice(0, 500) };
        });
        return { currentWindow: windows.find(window => window.current) ?? null, activeWindow: windows.find(window => window.active) ?? null,
            document: { type: editor.documentType, name: editor.name, view: editor.documentContainer.currentView }, selection, selectionTruncated: instance.selectionService.selectedElements.length > 30,
            fields: { html: 'Authored fragment', style: 'Separate document CSS/style dock', script: 'Separate ES module JavaScript dock', settings: 'Dimensions, adopted styles, screen/control settings', properties: 'Typed screen/control properties with defaults and internal flags' } };
    }
    selectedDocument() {
        const editor = this.shell.getActiveScreenEditor();
        return editor ? { type: editor.documentType, name: editor.name } : null;
    }
    globalContext() { return structuredClone(iobrokerHandler.config); }
    private async allElements() {
        const services = this.shell.serviceContainer.elementsServices;
        const key = services.map(service => service.name).join('|');
        if (!this.elementSnapshot || this.elementSnapshot.key !== key || this.elementSnapshot.expires < Date.now()) {
            const promise = (async () => {
                const results = await Promise.allSettled(services.map(async service => (await service.getElements()).map(({ tag, name, description, defaultAttributes, defaultStyles, defaultContent, defaultWidth, defaultHeight, packageName }) => ({
                    group: service.name, packageName, tag, name, description, defaultAttributes, defaultStyles, defaultContent: typeof defaultContent === 'string' ? defaultContent.slice(0, 2000) : undefined, defaultWidth, defaultHeight
                }))));
                const elements = results.flatMap<any>((result, index) => result.status === 'fulfilled' ? result.value : [{ group: services[index].name, error: String(result.reason) }]);
                const controls = await iobrokerHandler.getAllNames('control');
                return [...elements, ...controls.map(name => ({ group: 'webui-controls', tag: getCustomControlName(name), name, controlName: name, description: 'Reusable control from this webui workspace. Use describe_element for its authored properties.' }))];
            })();
            this.elementSnapshot = { key, expires: Date.now() + 10000, promise };
        }
        return this.elementSnapshot.promise;
    }
    async elements(options: { query?: string; group?: string; offset?: number; limit?: number } = {}) {
        const entries = await this.allElements();
        const words = (options.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        const matches = entries.filter(entry => (!options.group || entry.group === options.group) && words.every(word => JSON.stringify(entry).toLowerCase().includes(word)));
        return { ...pageItems(matches, options.offset, options.limit), groups: [...new Set(entries.map(entry => entry.group))] };
    }
    async describeElement(tag: string, group?: string) {
        const definitions = (await this.allElements()).filter(entry => entry.tag === tag && (!group || entry.group === group));
        if (!definitions.length) throw new Error('Choose a component returned by list_elements.');
        const definition = definitions.find(entry => entry.controlName) ?? definitions[0];
        if (definition.controlName) {
            const control = await this.readDocument('control', definition.controlName);
            return { ...definition, properties: control?.properties, settings: control?.settings, document: { type: 'control', name: definition.controlName }, registered: !!customElements.get(tag) };
        }
        const webuiApi = webuiComponentApi(tag);
        if (webuiApi) return { ...definition, api: webuiApi, apiSource: 'webui runtime', registered: !!customElements.get(tag) };
        const packageName = definition.packageName ?? definition.group;
        const installed = await this.installedPackages();
        if (Object.hasOwn(installed, packageName)) {
            try {
                const root = 'node_modules/' + assetPath(packageName) + '/';
                const meta = JSON.parse(String((await iobrokerHandler.connection.readFile(iobrokerHandler.namespaceWidgets, root + 'package.json', false)).file));
                const path = assetPath(String(meta.customElements ?? 'custom-elements.json').replace(/^\.\//, ''));
                const manifest = JSON.parse(String((await iobrokerHandler.connection.readFile(iobrokerHandler.namespaceWidgets, root + path, false)).file));
                const api = componentApi(manifest, tag);
                if (api) return { ...definition, api, apiSource: 'installed manifest', registered: !!customElements.get(tag) };
            } catch { /* Manifest-less libraries can still have catalog documentation. */ }
        }
        try { return { ...definition, api: describePackage(packageName, tag).components[0], apiSource: 'repository snapshot', registered: !!customElements.get(tag) }; }
        catch { return { ...definition, apiSource: 'designer element definition', registered: !!customElements.get(tag), message: 'Detailed manifest unavailable. Read existing authored examples; do not invent component properties.' }; }
    }
    listAssets(request: AssetRequest) { return this.assets.list(request); }
    async readAsset(request: AssetRequest) {
        const result = await this.assets.read(request, false);
        const { base64: _base64, ...metadata } = result as typeof result & { base64?: string };
        return metadata;
    }
    async previewAsset(request: AssetRequest) {
        const data = await this.assets.read(request);
        if (typeof data.base64 !== 'string' || typeof data.mimeType !== 'string') throw new Error('Chart presets expose their saved configuration and URL, not a raster preview.');
        return assetPreview({ base64: data.base64, mimeType: data.mimeType, path: `${request.kind}:${data.namespace}/${request.path}` });
    }
    async installedPackages(): Promise<Record<string, string>> {
        try {
            const result = await iobrokerHandler.connection.readFile(iobrokerHandler.namespaceWidgets, 'package.json', false);
            return JSON.parse(String(result.file)).dependencies ?? {};
        } catch (error) {
            // A fresh installation has no widget package.json yet.
            if (/not exist|not found|ENOENT|no such file/i.test(String(error))) return {};
            throw error;
        }
    }
    async addPackage(value: string) {
        const name = allowedPackageName(value);
        let timer: ReturnType<typeof setTimeout>;
        const result = await Promise.race([
            iobrokerHandler.connection.sendTo<{ name: string; status: string; version: string; error?: string }>(iobrokerHandler.namespace, 'ai:addPackage', { name }),
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Package request timed out. Installation may still be running; check npm status before retrying.')), 300_000); })
        ]).finally(() => clearTimeout(timer));
        if (!result || result.error) throw new Error(result?.error ?? 'The adapter did not report a package result. Update/restart the adapter.');
        if (result.name !== name || !['installed', 'already-installed'].includes(result.status) || typeof result.version !== 'string') throw new Error('The adapter returned an invalid package result.');
        try {
            this.elementSnapshot = null;
            const container = this.shell.serviceContainer;
            const registered = container.elementsServices.map(service => service.name);
            await loadInstalledPackages(window.iobrokerWebRootUrl + iobrokerHandler.namespaceWidgets + '/', { widgets: config => config.registerNpmWidgets(container, registered), addons: config => config.registerDesignerAddons(container, registered) });
            for (const [library, tags] of observer.getElements()) {
                if (tags.length && !container.elementsServices.some(service => service.name === library)) container.register('elementsService', new PreDefinedElementsService(library, { elements: tags }));
            }
            const tags = describePackage(name).components.map(component => component.tag).filter(tag => !!customElements.get(tag));
            return { ...result, editorReady: tags.length > 0, registeredTags: tags, message: tags.length ? 'Package available in this editor. Screen files are unchanged.' : 'Installed, but no catalog component tags registered. Check the adapter/browser log before using the package.' };
        } catch (error) {
            return { ...result, editorReady: false, message: `Installed, but browser activation failed: ${String(error)}. Preserve unsaved work before manually reloading.` };
        }
    }
    async searchObjects(type: string, query: string, offset: number, limit: number) {
        let snapshot = this.objectSnapshots.get(type);
        if (!snapshot || snapshot.expires < Date.now()) {
            const objects = await iobrokerHandler.connection.getObjectViewSystem(type as ioBroker.ObjectType);
            snapshot = { expires: Date.now() + 10000, objects: Object.values(objects).map(objectMetadata) };
            this.objectSnapshots.set(type, snapshot);
        }
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        const matches = snapshot.objects.filter(object => words.every(word => JSON.stringify(object).toLowerCase().includes(word))).sort((a, b) => a.id.localeCompare(b.id));
        return { total: matches.length, offset, objects: matches.slice(offset, offset + limit), nextOffset: offset + limit < matches.length ? offset + limit : null };
    }
    async readObject(id: string) { return objectMetadata(await iobrokerHandler.connection.getObject(id)); }
    async readState(id: string) { return iobrokerHandler.getState(id); }
}
