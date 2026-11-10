// Deterministic ioBroker + AI protocol fixture for browser smoke tests.
const answerCallbacks = new Set();
let toolId = 0;
let packageInstalled = false;
const fixtureOptions = new URLSearchParams(location.search);
const responseDelay = Math.min(10000, Math.max(50, Number(fixtureOptions.get('aiDelay')) || 350));
// Opt-in speech fixture: exercises the microphone UI without recording real audio.
if (fixtureOptions.get('speechFixture') === '1') {
    window.SpeechRecognition = class {
        start() { this.timer = setTimeout(() => this.onresult?.({ results: [[{ transcript: 'Design a spoken dashboard' }]] }), 400); }
        stop() { clearTimeout(this.timer); this.onend?.(); }
        abort() { clearTimeout(this.timer); this.onend?.(); }
    };
}
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
    readDir: async () => [], readFile: async () => ({ file: JSON.stringify({ dependencies: packageInstalled ? { 'vanilla-colorful': '^0.7.2' } : {} }), mimeType: 'application/json' }),
    writeFile64: async () => {},
    subscribeOnInstance: async (instance, type, data, callback) => { answerCallbacks.add(callback); return { accepted: true, session: 'fixture-token' }; },
    unsubscribeFromInstance: async (instance, type, callback) => answerCallbacks.delete(callback),
    sendTo: async (instance, command, request) => {
        if (command === 'ai:providers') return { providers: [{ provider: 'custom' }] };
        if (command === 'ai:models') return { models: ['fixture-vision-model'] };
        if (command === 'ai:addPackage' && fixtureOptions.has('packageFixture')) {
            packageInstalled = true;
            return { name: request.name, status: 'installed', version: '^0.7.2' };
        }
        const previousCalls = request.messages.filter(x => x.role === 'tool').length;
        const turn = request.messages.filter(x => x.role === 'user').length;
        let tool_calls;
        if (previousCalls < turn * 2 - 1) tool_calls = [{ id: 'fixture-tool-' + Date.now() + '-' + ++toolId, type: 'function', function: { name: 'read_document', arguments: '{"type":"screen","name":"smoke-screen"}' } }];
        else if (previousCalls < turn * 2) tool_calls = [{ id: 'fixture-tool-' + Date.now() + '-' + ++toolId, type: 'function', function: { name: 'stage_document', arguments: JSON.stringify({ type: 'screen', name: 'smoke-screen', html: '<h1>AI designed screen</h1><p bind-content:text="fixture.0.temperature"></p>', style: ':host { display:block; padding:24px; color:teal; }' }) } }];
        if (fixtureOptions.has('packageFixture')) {
            const sequence = [['list_packages', { query: 'color' }], ['describe_package', { name: 'vanilla-colorful' }], ['add_package', { name: 'vanilla-colorful' }], ['list_elements', {}]];
            const next = sequence[previousCalls];
            tool_calls = next ? [{ id: 'package-fixture-' + ++toolId, type: 'function', function: { name: next[0], arguments: JSON.stringify(next[1]) } }] : undefined;
        }
        let answer = 'The proposed screen is ready. Review the changes below, then apply them to the editor.';
        if (fixtureOptions.has('packageFixture')) {
            const result = request.messages.filter(message => message.role === 'tool').find(message => String(message.content).includes('editorReady'));
            const ready = result && JSON.parse(result.content).editorReady;
            answer = ready ? 'Test fixture: package installed, editorReady true; discovery and widget activation completed without reloading.' : 'Test fixture: package activation failed.';
        }
        setTimeout(() => {
            for (const callback of answerCallbacks) callback({ type: 'aiChatAnswer', requestId: request.requestId, success: true, ...(fixtureOptions.has('costFixture') ? {estimatedCost:{amount:0.001,currency:'USD'}} : {}), content: tool_calls ? '' : answer, ...(tool_calls ? { tool_calls } : {}) });
        }, responseDelay);
        return { accepted: true, requestId: request.requestId };
    }
};
