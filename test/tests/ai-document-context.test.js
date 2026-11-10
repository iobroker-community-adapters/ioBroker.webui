import { expect } from 'chai';
import { parse } from '@node-projects/node-html-parser-esm';
import { AiToolContext, webuiKnowledge } from '../../dist/frontend/ai/AiTools.js';
import { patchElementAttributes, textChunk } from '../../dist/frontend/ai/AiDocumentEditing.js';

const original = { html: '<!--keep--><section><div id="temperature">Heating</div><button id="aa">Open door</button></section>', style: ':host { display:block }', script: 'export function init() {}', settings: { width: '800px' }, properties: { enabled: { type: 'boolean', default: false }, value: { type: 'number', default: 0 } } };
function byId(root, id) { for (const node of root.childNodes ?? []) { if (node.getAttribute?.('id') === id) return node; const found = byId(node, id); if (found) return found; } }
const converter = JSON.stringify({ signal: 'weather.0.outdoor', converter: { '<=0': '#1565c0', '>=20': '#c62828', '0-20': '#8e7ab5' }, converterDefault: '#808080' });
function context() { const proposals = []; return { proposals, tools: new AiToolContext({ readDocument: async () => structuredClone(original), editorContext: async () => ({ document: { type: 'screen', name: 'heating' }, selection: [{ path: [0, 0], id: 'temperature' }] }), listWindows: () => [{ id: 'screen_heating' }] }, proposals) }; }

describe('AI authored document context and focused edits', () => {
    it('stages a selected-element CSS converter while preserving the rest of the screen', async () => {
        const { tools, proposals } = context();
        const editor = JSON.parse(await tools.run('get_editor_context', {}));
        await tools.run('read_document', { type: 'screen', name: 'heating' });
        await tools.run('stage_element_attributes', { type: 'screen', name: 'heating', path: editor.selection[0].path, attributes: { 'bind-css:background-color': converter } });
        const doc = parse(proposals[0].data.html);
        expect(JSON.parse(byId(doc, 'temperature').getAttribute('bind-css:background-color'))).to.deep.equal(JSON.parse(converter));
        expect(byId(doc, 'aa').toString()).to.equal('<button id="aa">Open door</button>');
        expect(proposals[0].data).to.include({ style: original.style, script: original.script });
        expect(proposals[0].data.properties).to.deep.equal(original.properties);
        expect(proposals[0].before).to.deep.equal(original); expect(proposals[0].status).to.equal('pending');
    });
    it('adds a simple-script door action as an authored @click attribute without executing it', async () => {
        const { tools, proposals } = context();
        const command = JSON.parse(await tools.run('describe_webui', { topic: 'commands', definition: 'SetSignalValue' }));
        expect(command.properties.signal.format).to.equal('signal');
        await tools.run('read_document', { type: 'screen', name: 'heating' });
        const script = { commands: [{ type: 'SetSignalValue', signal: 'door.0.open', target: 'signal', value: true }] };
        await tools.run('stage_element_attributes', { type: 'screen', name: 'heating', selector: '#aa', attributes: { '@click': JSON.stringify(script) } });
        expect(JSON.parse(byId(parse(proposals[0].data.html), 'aa').getAttribute('@click'))).to.deep.equal(script);
        expect(proposals[0].data.script).to.equal(original.script);
    });
    it('requires a known read base and refuses ambiguous or stale element references', async () => {
        const { tools } = context();
        await expect(tools.run('stage_element_attributes', { type: 'screen', name: 'heating', path: [0], attributes: {} })).to.be.rejectedWith('read_document first');
        expect(() => patchElementAttributes('<div></div><div></div>', { selector: 'div' }, { title: 'x' })).to.throw('exactly one');
        expect(() => patchElementAttributes('<div></div>', { path: [1] }, { title: 'x' })).to.throw('does not exist');
        expect(() => patchElementAttributes('<div></div>', { path: [] }, {})).to.throw('nonempty');
    });
    it('reads source in bounded chunks and documents field placement and simple-script preference', async () => {
        const { tools } = context();
        const chunk = JSON.parse(await tools.run('read_document_field', { type: 'screen', name: 'heating', field: 'html', offset: 0, limit: 10 }));
        expect(chunk.text).to.equal(original.html.slice(0, 10)); expect(chunk.nextOffset).to.equal(10);
        const doc = await tools.run('describe_webui', { topic: 'document' });
        expect(doc).to.contain('extra CSS dock').and.contain('extra JavaScript dock');
        expect(webuiKnowledge).to.contain('Prefer declarative bindings and JSON simple scripts');
        expect(textChunk('a'.repeat(40000), 0, 999999).text).to.have.length(30000);
    });
});
