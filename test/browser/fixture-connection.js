// Deterministic ioBroker + AI protocol fixture for browser smoke tests.
const answerCallbacks = new Set();
let toolId = 0;
const state = { val: 21, ack: true, ts: Date.now(), lc: Date.now(), from: 'fixture' };
const objects = { 'fixture.0.temperature': { _id: 'fixture.0.temperature', type: 'state', common: { name: 'Temperature', type: 'number', role: 'value.temperature', read: true, write: false, unit: '°C' }, native: {} } };
export const fixtureConnection = {
    waitForFirstConnection: async () => {},
    registerConnectionHandler() {}, unregisterConnectionHandler() {},
    getCurrentUser: async () => 'system.user.fixture',
    getObjects: async () => objects,
    getObjectViewSystem: async type => type === 'state' ? objects : {},
    getObjectViewCustom: async () => ({}),
    getObject: async id => objects[id],
    getState: async id => id.endsWith('npm') ? { ...state, val: 'idle' } : state,
    setState: async () => {}, subscribeState: async () => {}, unsubscribeState() {},
    readDir: async () => [], readFile: async () => ({ file: '{}', mimeType: 'application/json' }),
    writeFile64: async () => {},
    subscribeOnInstance: async (instance, type, data, callback) => { answerCallbacks.add(callback); return { accepted: true, session: 'fixture-token' }; },
    unsubscribeFromInstance: async (instance, type, callback) => answerCallbacks.delete(callback),
    sendTo: async (instance, command, request) => {
        if (command === 'ai:providers') return { providers: [{ provider: 'custom' }] };
        if (command === 'ai:models') return { models: ['fixture-vision-model'] };
        const previousCalls = request.messages.filter(x => x.role === 'tool').length;
        const turn = request.messages.filter(x => x.role === 'user').length;
        let tool_calls;
        if (previousCalls < turn * 2 - 1) tool_calls = [{ id: 'fixture-tool-' + ++toolId, type: 'function', function: { name: 'read_document', arguments: '{"type":"screen","name":"smoke-screen"}' } }];
        else if (previousCalls < turn * 2) tool_calls = [{ id: 'fixture-tool-' + ++toolId, type: 'function', function: { name: 'stage_document', arguments: JSON.stringify({ type: 'screen', name: 'smoke-screen', html: '<h1>AI designed screen</h1><p bind-content:text="fixture.0.temperature"></p>', style: ':host { display:block; padding:24px; color:teal; }' }) } }];
        setTimeout(() => {
            for (const callback of answerCallbacks) callback({ type: 'aiChatAnswer', requestId: request.requestId, success: true, content: tool_calls ? '' : 'The proposed screen is ready. Review it below, then apply it to the editor.', ...(tool_calls ? { tool_calls } : {}) });
        }, 350);
        return { accepted: true, requestId: request.requestId };
    }
};
