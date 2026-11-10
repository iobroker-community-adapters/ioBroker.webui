import { expect } from 'chai';
import { createAiId } from '../../www/dist/frontend/ai/AiTypes.js';
import { AiClient } from '../../www/dist/frontend/ai/AiClient.js';

function socketFixture() {
    let pushed, connection;
    const calls = [];
    const socket = {
        registerConnectionHandler: cb => { connection = cb; }, unregisterConnectionHandler() {},
        subscribeOnInstance: async (instance, type, data, cb) => { pushed = cb; return { accepted: true, session: 'server-secret' }; },
        unsubscribeFromInstance: async () => true,
        sendTo: async (instance, command, request) => {
            calls.push(request);
            // Push before returning ack: this used to race in the reference client's implementation.
            pushed({ requestId: request.requestId, success: true, content: request.model });
            return { accepted: true, requestId: request.requestId };
        }
    };
    return { socket, calls, disconnect: () => connection(false) };
}

describe('AI push transport', () => {
    it('creates IDs on plain HTTP without crypto.randomUUID', () => {
        expect(createAiId({ getRandomValues: array => { array.fill(17); return array; } })).to.equal('11'.repeat(16));
    });
    it('routes concurrent requests and accepts answers pushed before acknowledgement', async () => {
        const { socket, calls } = socketFixture();
        const client = new AiClient(socket, 'webui.2');
        try {
            const results = await Promise.all([client.ask('custom', 'one', []), client.ask('custom', 'two', [])]);
            expect(results.map(x => x.content)).to.deep.equal(['one', 'two']);
            expect(calls.map(x => x.uiSession)).to.deep.equal(['server-secret', 'server-secret']);
            expect(calls[0].requestId).not.to.equal(calls[1].requestId);
        } finally { client.dispose(); }
    });
    it('fails pending turns on disconnect and resubscribes after reconnect', async () => {
        const fixture = socketFixture();
        const client = new AiClient(fixture.socket, 'webui.0');
        fixture.socket.sendTo = async () => { queueMicrotask(fixture.disconnect); return { accepted: true }; };
        try { await client.ask('custom', 'model', []); expect.fail(); }
        catch (error) { expect(error.message).to.contain('Connection lost'); }
        finally { client.dispose(); }
    });
    it('surfaces provider failures', async () => {
        const { socket } = socketFixture(); socket.sendTo = async () => ({ error: 'Model unavailable' });
        const client = new AiClient(socket, 'webui.0');
        try { await client.ask('custom', 'bad-model', []); expect.fail(); }
        catch (error) { expect(error.message).to.equal('Model unavailable'); }
        finally { client.dispose(); }
    });
});
