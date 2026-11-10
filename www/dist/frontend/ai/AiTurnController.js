export function cancelPendingMessages(session) {
    for (const entry of session.entries)
        if (entry.delivery === 'steer' || entry.delivery === 'queue')
            entry.delivery = 'cancelled';
    session.pendingMessages = [];
}
/** Inject guidance only at provider-request boundaries; finish tool-result groups before continuing. */
export class AiTurnController {
    session;
    now;
    abort = new AbortController();
    constructor(session, now = Date.now) {
        this.session = session;
        this.now = now;
        session.pendingMessages ??= [];
    }
    add(message) { this.session.pendingMessages.push(message); }
    remove(id) {
        this.session.pendingMessages = this.session.pendingMessages.filter(message => message.id !== id);
        const entry = this.session.entries.find(entry => entry.pendingId === id);
        if (entry)
            entry.delivery = 'cancelled';
    }
    stop() { cancelPendingMessages(this.session); this.abort.abort(); }
    deliver(message, conversation) {
        conversation.push(message.message);
        const entry = this.session.entries.find(entry => entry.pendingId === message.id);
        if (entry)
            delete entry.delivery;
    }
    async run(options) {
        let startedAt = this.now();
        let conversation = [{ role: 'system', content: options.systemPrompt }, ...this.session.messages];
        try {
            for (;;) {
                const result = await options.loop({
                    messages: conversation, tools: options.tools, maxRounds: 20, finalAnswerWithoutTools: true,
                    shouldStop: () => this.abort.signal.aborted,
                    ask: async (messages, tools) => {
                        conversation = messages;
                        const guidance = this.session.pendingMessages.filter(message => message.mode === 'steer');
                        this.session.pendingMessages = this.session.pendingMessages.filter(message => message.mode !== 'steer');
                        for (const message of guidance)
                            this.deliver(message, messages);
                        if (guidance.length)
                            options.changed();
                        this.abort.signal.throwIfAborted();
                        return options.ask(messages, tools, this.abort.signal);
                    },
                    runTool: async (call, args) => {
                        this.abort.signal.throwIfAborted();
                        if (this.session.pendingMessages.some(message => message.mode === 'steer'))
                            return 'Skipped: the user has sent new guidance. Read their next message before taking another action.';
                        return options.runTool(call, args);
                    },
                    onAnswer: answer => {
                        if (!this.abort.signal.aborted && !this.session.pendingMessages.some(message => message.mode === 'steer')) {
                            const timestamp = this.now();
                            options.onAnswer(answer, { timestamp, durationMs: Math.max(0, timestamp - startedAt) });
                        }
                    },
                    onToolResult: options.onToolResult
                });
                if (this.abort.signal.aborted || result.stopped)
                    return;
                // A final answer can arrive while steering is waiting. Give the guidance its own request.
                if (this.session.pendingMessages.some(message => message.mode === 'steer'))
                    continue;
                const queued = this.session.pendingMessages.shift();
                if (!queued)
                    return;
                startedAt = this.now();
                this.deliver(queued, conversation);
                options.changed();
            }
        }
        finally {
            this.session.messages = conversation.filter(message => message.role !== 'system');
        }
    }
}
