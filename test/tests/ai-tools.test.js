import { expect } from 'chai';
import { AiToolContext, validateDocumentName } from '../../dist/frontend/ai/AiTools.js';
import { objectMetadata } from '../../www/dist/frontend/ai/AiObjectMetadata.js';
import { userMessage } from '../../www/dist/frontend/ai/AiAttachments.js';

const screen = () => ({ html: '<p>Existing</p>', style: ':host {color:red}', script: 'export function init() {}', settings: { width: '800px' }, properties: { zero: { type: 'number', default: 0 } } });
function fixture() {
    const proposals = [];
    const workspace = { readDocument: async (type, name) => name === 'existing' ? screen() : null, listDocuments: async () => ['existing'], searchObjects: async (...args) => args };
    return { context: new AiToolContext(workspace, proposals), proposals };
}

describe('AI screen tools', () => {
    it('requires a read before staging, including a new document', async () => {
        const { context } = fixture();
        try { await context.run('stage_document', { type: 'screen', name: 'new', html: '' }); expect.fail('expected read guard'); }
        catch (error) { expect(error.message).to.contain('read_document first'); }
    });
    it('preserves omitted CSS, scripts, settings and typed defaults without mutating the source', async () => {
        const { context, proposals } = fixture();
        await context.run('read_document', { type: 'screen', name: 'existing' });
        await context.run('stage_document', { type: 'screen', name: 'existing', html: '<p>New</p>' });
        expect(proposals[0].before).to.deep.equal(screen());
        expect(proposals[0].data).to.deep.equal({ ...screen(), html: '<p>New</p>' });
        await context.run('stage_document', { type: 'screen', name: 'existing', style: '' });
        expect(proposals).to.have.length(1);
        expect(proposals[0].data.html).to.equal('<p>New</p>');
        expect(proposals[0].before.style).to.equal(':host {color:red}');
    });
    it('rebases a stale pending proposal when the screen is read in a later turn', async () => {
        const { context, proposals } = fixture();
        await context.run('read_document', { type: 'screen', name: 'existing' });
        await context.run('stage_document', { type: 'screen', name: 'existing', html: '<p>First proposal</p>' });
        const changed = { ...screen(), html: '<p>Manual edit</p>' };
        const next = new AiToolContext({ readDocument: async () => changed }, proposals);
        const read = JSON.parse(await next.run('read_document', { type: 'screen', name: 'existing' }));
        expect(read.supersededProposal).to.equal(true);
        expect(read.data.html).to.equal(changed.html);
        expect(proposals[0].status).to.equal('discarded');
        await next.run('stage_document', { type: 'screen', name: 'existing', style: 'p { color:blue; }' });
        expect(proposals[1].before.html).to.equal(changed.html);
        expect(proposals[1].data.html).to.equal(changed.html);
    });
    it('never exposes native credentials or custom adapter settings as object metadata', () => {
        const metadata = objectMetadata({ _id: 'adapter.0.device', type: 'state', common: { name: 'Device', role: 'switch', custom: { token: 'secret' } }, native: { password: 'secret' }, acl: { owner: 'private' } });
        expect(metadata).to.deep.equal({ id: 'adapter.0.device', type: 'state', common: { name: 'Device', role: 'switch' } });
    });
    it('creates a complete new document proposal without saving it', async () => {
        const { context, proposals } = fixture();
        await context.run('read_document', { type: 'control', name: 'folder/new' });
        await context.run('stage_document', { type: 'control', name: 'folder/new', html: '<button>New</button>' });
        expect(proposals[0]).to.include({ type: 'control', name: 'folder/new', before: null, status: 'pending' });
        expect(proposals[0].data).to.have.all.keys('html', 'style', 'script', 'settings', 'properties');
    });
    it('rejects unsafe paths and invalid content', async () => {
        for (const name of ['../escape', '/absolute', 'a/../b', 'a\\b', 'a//b', '', 'a\n']) expect(() => validateDocumentName(name)).to.throw();
        const { context } = fixture();
        await context.run('read_document', { type: 'screen', name: 'existing' });
        try { await context.run('stage_document', { type: 'screen', name: 'existing', html: 42 }); expect.fail(); }
        catch (error) { expect(error.message).to.contain('html must be a string'); }
    });
    it('clamps object search pagination and exposes no write-state tool', async () => {
        const { context } = fixture();
        expect(JSON.parse(await context.run('search_objects', { offset: -1, limit: 1000 }))).to.deep.equal(['state', '', 0, 100]);
        try { await context.run('set_state', {}); expect.fail(); }
        catch (error) { expect(error.message).to.contain('Unknown tool'); }
    });
    it('provides the actual command schemas and binding syntax', async () => {
        const { context } = fixture();
        expect(await context.run('describe_webui', { topic: 'bindings' })).to.contain('bind-class:active');
        expect(JSON.parse(await context.run('describe_webui', { topic: 'commands', definition: 'SetSignalValue' })).properties).to.have.keys('type', 'signal', 'value', 'target', 'additionalData');
    });
});

describe('AI attachments', () => {
    it('sends attached source text and image content in provider-compatible blocks', () => {
        const result = userMessage('Build this', [{ name: 'reference.css', type: 'text/plain', content: ':host {}' }, { name: 'shot.png', type: 'image/png', content: 'data:image/png;base64,AA==' }], 'custom');
        expect(result.content[0].text).to.contain('reference.css\n:host {}');
        expect(result.content[1]).to.deep.equal({ type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } });
    });
    it('explains the upstream Anthropic screenshot limit instead of silently dropping the image', () => {
        expect(() => userMessage('Describe', [{ name: 'shot.png', type: 'image/png', content: 'data:image/png;base64,AA==' }], 'anthropic')).to.throw('Anthropic bridge supports text only');
    });
});
