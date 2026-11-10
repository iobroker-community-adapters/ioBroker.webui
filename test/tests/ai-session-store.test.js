import { expect } from 'chai';
import { AiSessionStore } from '../../dist/frontend/ai/AiSessionStore.js';

describe('Temporary AI sessions', () => {
    it('does not access IndexedDB or restore/save fixture history', async () => {
        // Node has no IndexedDB; any accidental database access fails this test.
        const store = new AiSessionStore('test-only', false);
        expect(await store.load()).to.deep.equal([]);
        expect(await store.loadDraft()).to.equal(null);
        await store.save([{ title: 'Test conversation' }]);
        expect(await store.load()).to.deep.equal([]);
    });
});
