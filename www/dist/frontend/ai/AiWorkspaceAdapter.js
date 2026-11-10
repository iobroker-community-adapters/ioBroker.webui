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
    async searchObjects(type, query, offset, limit) {
        const objects = await iobrokerHandler.connection.getObjectViewSystem(type);
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        const matches = Object.values(objects).map(objectMetadata).filter(object => words.every(word => JSON.stringify(object).toLowerCase().includes(word))).sort((a, b) => a.id.localeCompare(b.id));
        return { total: matches.length, offset, objects: matches.slice(offset, offset + limit), nextOffset: offset + limit < matches.length ? offset + limit : null };
    }
    async readObject(id) { return objectMetadata(await iobrokerHandler.connection.getObject(id)); }
    async readState(id) { return iobrokerHandler.getState(id); }
}
