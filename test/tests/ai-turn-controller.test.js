import { runToolLoop } from '@iobroker/ai-core/build/shared/index.js';
import { expect } from 'chai';
import { AiTurnController } from '../../www/dist/frontend/ai/AiTurnController.js';
import { AiSpeechInput } from '../../www/dist/frontend/ai/AiSpeechInput.js';

function fixture() {
    const session = { messages: [{ role: 'user', content: 'Initial task' }], entries: [], pendingMessages: [] };
    const controller = new AiTurnController(session);
    const pending = (mode, text) => {
        const id = text;
        session.entries.push({ role: 'user', text, pendingId: id, delivery: mode });
        controller.add({ id, mode, text, message: { role: 'user', content: text } });
    };
    const options = { loop: runToolLoop, systemPrompt: 'system', tools: [{ type: 'function', function: { name: 'stage_document' } }], changed() {}, onAnswer() {}, onToolResult() {}, runTool: async () => 'done' };
    return { session, controller, pending, options };
}
const call = { id: 'call-1', type: 'function', function: { name: 'stage_document', arguments: '{}' } };

describe('AI turn steering and queue', () => {
    it('skips stale tool calls and injects guidance before the next model request', async () => {
        const { session, controller, pending, options } = fixture(); let asks = 0, toolRuns = 0;
        await controller.run({ ...options, runTool: async () => { toolRuns++; return 'done'; }, ask: async messages => {
            if (!asks++) { pending('steer', 'Use a blue background'); return { content: '', tool_calls: [call] }; }
            expect(messages.at(-1)).to.deep.equal({ role: 'user', content: 'Use a blue background' });
            expect(messages.find(message => message.role === 'tool').content).to.contain('Skipped');
            return { content: 'Blue layout ready' };
        } });
        expect(toolRuns).to.equal(0); expect(asks).to.equal(2);
        expect(session.messages.map(message => message.role)).to.deep.equal(['user', 'assistant', 'tool', 'user', 'assistant']);
        expect(session.entries[0].delivery).to.equal(undefined);
    });
    it('handles steering that arrives with a final answer instead of dropping it', async () => {
        const { controller, pending, options } = fixture(); let asks = 0; const displayed = [];
        await controller.run({ ...options, onAnswer: answer => displayed.push(answer.content), ask: async messages => {
            if (!asks++) { pending('steer', 'Make it compact'); return { content: 'Initial answer' }; }
            expect(messages.at(-1).content).to.equal('Make it compact'); return { content: 'Compact answer' };
        } });
        expect(asks).to.equal(2); expect(displayed).to.deep.equal(['Compact answer']);
    });
    it('runs queued messages after finishing the current turn and in order', async () => {
        const { session, controller, pending, options } = fixture(); let asks = 0, toolRuns = 0;
        await controller.run({ ...options, runTool: async () => { toolRuns++; return 'done'; }, ask: async messages => {
            asks++;
            if (asks === 1) { pending('queue', 'Second task'); pending('queue', 'Third task'); return { content: '', tool_calls: [call] }; }
            if (asks === 2) { expect(messages.some(message => message.content === 'Second task')).to.equal(false); return { content: 'First completed' }; }
            expect(messages.at(-1).content).to.equal(asks === 3 ? 'Second task' : 'Third task'); return { content: 'Done' };
        } });
        expect(toolRuns).to.equal(1); expect(asks).to.equal(4); expect(session.pendingMessages).to.have.length(0);
    });
    it('removes pending messages and stops without running tools or queued work', async () => {
        const { session, controller, pending, options } = fixture(); let toolRuns = 0;
        await controller.run({ ...options, runTool: async () => { toolRuns++; return 'done'; }, ask: async () => {
            pending('queue', 'Do not run'); controller.stop(); return { content: '', tool_calls: [call] };
        } });
        expect(toolRuns).to.equal(0); expect(session.pendingMessages).to.have.length(0); expect(session.entries[0].delivery).to.equal('cancelled');
        expect(session.messages.at(-1).role).to.equal('tool');
    });
});

describe('AI speech dictation', () => {
    it('fills the draft from interim/final results and ignores late events after cancellation', () => {
        let recognition, transcript = '', errors = [];
        class Recognition { constructor() { recognition = this; } start() {} stop() { this.onend(); } abort() {} }
        const speech = new AiSpeechInput(() => Recognition);
        speech.start('de-DE', { text: value => { transcript = value; }, changed() {}, error: error => errors.push(error) });
        recognition.onresult({ results: [[{ transcript: 'Make a dashboard' }]] });
        expect(transcript).to.equal('Make a dashboard'); expect(speech.listening).to.equal(true); expect(recognition.lang).to.equal('de-DE');
        speech.cancel(); recognition.onresult({ results: [[{ transcript: 'Late text' }]] });
        expect(transcript).to.equal('Make a dashboard'); expect(speech.listening).to.equal(false); expect(errors).to.have.length(0);
    });
    it('reports unsupported speech input and denied microphone access', () => {
        let message = '';
        const callbacks = { text() {}, changed() {}, error: value => { message = value; } };
        const unsupported = new AiSpeechInput(() => undefined); unsupported.start('en', callbacks);
        expect(message).to.contain('not supported');
        let recognition;
        class Recognition { constructor() { recognition = this; } start() {} abort() {} }
        const speech = new AiSpeechInput(() => Recognition); speech.start('en', callbacks); recognition.onerror({ error: 'not-allowed' });
        expect(message).to.contain('denied'); expect(speech.listening).to.equal(false);
    });
});
