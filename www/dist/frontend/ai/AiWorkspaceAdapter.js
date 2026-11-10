import { textChunk } from './AiDocumentEditing.js';
import { IobrokerWebuiScreenEditor } from '../config/IobrokerWebuiScreenEditor.js';
import { IobrokerWebuiMonacoEditor } from '../config/IobrokerWebuiMonacoEditor.js';
import { PreDefinedElementsService } from '@node-projects/web-component-designer';
import observer from '../widgets/customElementsObserver.js';
import { allowedPackageName, describePackage } from '../npm/PackageCatalog.js';
import { loadInstalledPackages } from '../npm/LoadInstalledPackages.js';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { sameDocument } from './AiTypes.js';
import { objectMetadata } from './AiObjectMetadata.js';
export class AiWorkspaceAdapter {
    shell;
    constructor(shell) {
        this.shell = shell;
    }
    async listDocuments(type) {
        return [...new Set([...await iobrokerHandler.getAllNames(type), ...this.shell.getScreenEditors().filter(x => x.documentType === type).map(x => x.name)])].sort();
    }
    async readDocument(type, name) {
        const editor = this.shell.getScreenEditors().find(x => x.documentType === type && x.name === name);
        if (editor)
            return editor.getSnapshot();
        const names = await iobrokerHandler.getAllNames(type);
        if (!names.includes(name))
            return null;
        const data = await iobrokerHandler.getWebuiObject(type, name);
        if (!data)
            throw new Error(`Could not read ${type} ${name}.`);
        return structuredClone(data);
    }
    async applyProposal(proposal) {
        const current = await this.readDocument(proposal.type, proposal.name);
        if (!sameDocument(current, proposal.before))
            throw new Error(`${proposal.name} changed after the AI read it. Ask the assistant to read it again and make a new proposal.`);
        const editor = await this.shell.openScreenEditor(proposal.name, proposal.type, proposal.data.html, proposal.data.style, proposal.data.script, proposal.data.settings, proposal.data.properties);
        if (!editor)
            throw new Error('The screen editor did not open.');
        await editor.applyAiSnapshot(proposal.data);
    }
    listWindows() { return this.shell.getAiWindows(); }
    async readWindow(id, offset = 0, limit = 12000) {
        const element = this.shell.getAiWindowElement(id);
        if (!element)
            throw new Error('This window is no longer open.');
        if (element instanceof IobrokerWebuiScreenEditor)
            return { id, document: { type: element.documentType, name: element.name }, message: 'Use read_document or read_document_field for its authored source and properties.' };
        const code = element instanceof IobrokerWebuiMonacoEditor ? element : element.querySelector('iobroker-webui-monaco-editor');
        if (code)
            return { id, kind: 'code', language: code.language, ...textChunk(code.model?.getValue() ?? '', offset, limit) };
        return { id, kind: 'tool', message: 'Tool window. Use get_editor_context for its associated document and selection.' };
    }
    async editorContext() {
        const windows = this.shell.getAiWindows();
        const editor = this.shell.getActiveScreenEditor();
        if (!editor)
            return { currentWindow: windows.find(window => window.current) ?? null, activeWindow: windows.find(window => window.active) ?? null, document: null, selection: [] };
        await editor.documentContainer.commitPendingChanges();
        const instance = editor.documentContainer.instanceServiceContainer;
        const root = editor.documentContainer.editingDocument.rootDesignItem;
        const selection = instance.selectionService.selectedElements.slice(0, 30).map(item => {
            const path = [];
            let current = item;
            while (current && current !== root && current.parent) {
                const siblings = [...current.parent.children()].filter(child => child.node.nodeType === 1);
                path.unshift(siblings.indexOf(current));
                current = current.parent;
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
    async elements() {
        const result = await Promise.all(this.shell.serviceContainer.elementsServices.map(async (service) => ({
            group: service.name,
            elements: (await service.getElements()).map(({ tag, name, description, defaultAttributes, defaultStyles, defaultContent }) => ({ tag, name, description, defaultAttributes, defaultStyles, defaultContent }))
        })));
        return result;
    }
    async installedPackages() {
        try {
            const result = await iobrokerHandler.connection.readFile(iobrokerHandler.namespaceWidgets, 'package.json', false);
            return JSON.parse(String(result.file)).dependencies ?? {};
        }
        catch (error) {
            // A fresh installation has no widget package.json yet.
            if (/not exist|not found|ENOENT|no such file/i.test(String(error)))
                return {};
            throw error;
        }
    }
    async addPackage(value) {
        const name = allowedPackageName(value);
        let timer;
        const result = await Promise.race([
            iobrokerHandler.connection.sendTo(iobrokerHandler.namespace, 'ai:addPackage', { name }),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Package request timed out. Installation may still be running; check npm status before retrying.')), 300_000); })
        ]).finally(() => clearTimeout(timer));
        if (!result || result.error)
            throw new Error(result?.error ?? 'The adapter did not report a package result. Update/restart the adapter.');
        if (result.name !== name || !['installed', 'already-installed'].includes(result.status) || typeof result.version !== 'string')
            throw new Error('The adapter returned an invalid package result.');
        try {
            const container = this.shell.serviceContainer;
            const registered = container.elementsServices.map(service => service.name);
            await loadInstalledPackages(window.iobrokerWebRootUrl + iobrokerHandler.namespaceWidgets + '/', { widgets: config => config.registerNpmWidgets(container, registered), addons: config => config.registerDesignerAddons(container, registered) });
            for (const [library, tags] of observer.getElements()) {
                if (tags.length && !container.elementsServices.some(service => service.name === library))
                    container.register('elementsService', new PreDefinedElementsService(library, { elements: tags }));
            }
            const tags = describePackage(name).components.map(component => component.tag).filter(tag => !!customElements.get(tag));
            return { ...result, editorReady: tags.length > 0, registeredTags: tags, message: tags.length ? 'Package available in this editor. Screen files are unchanged.' : 'Installed, but no catalog component tags registered. Check the adapter/browser log before using the package.' };
        }
        catch (error) {
            return { ...result, editorReady: false, message: `Installed, but browser activation failed: ${String(error)}. Preserve unsaved work before manually reloading.` };
        }
    }
    async searchObjects(type, query, offset, limit) {
        const objects = await iobrokerHandler.connection.getObjectViewSystem(type);
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        const matches = Object.values(objects).map(objectMetadata).filter(object => words.every(word => JSON.stringify(object).toLowerCase().includes(word))).sort((a, b) => a.id.localeCompare(b.id));
        return { total: matches.length, offset, objects: matches.slice(offset, offset + limit), nextOffset: offset + limit < matches.length ? offset + limit : null };
    }
    async readObject(id) { return objectMetadata(await iobrokerHandler.connection.getObject(id)); }
    async readState(id) { return iobrokerHandler.getState(id); }
}
