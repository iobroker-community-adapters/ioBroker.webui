import { createAiId } from './AiTypes.js';
function timeout(job, ms, signal) {
    if (signal?.aborted)
        return Promise.reject(signal.reason);
    let timer;
    let abort;
    return Promise.race([job, new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('The AI adapter did not answer in time.')), ms);
            abort = () => reject(signal.reason);
            signal?.addEventListener('abort', abort, { once: true });
        })]).finally(() => { clearTimeout(timer); signal?.removeEventListener('abort', abort); });
}
/** Same ai-core push protocol as vis-2, without a React dependency. */
export class AiClient {
    socket;
    instance;
    token;
    subscription;
    disposed = false;
    pending = new Map();
    pushed = (data) => {
        const answer = data;
        if (answer?.requestId)
            this.pending.get(answer.requestId)?.resolve(answer);
    };
    connectionChanged = (connected) => {
        if (!connected) {
            this.token = null;
            this.subscription = null;
            for (const job of this.pending.values())
                job.reject(new Error('Connection lost. Retry after reconnecting.'));
            this.pending.clear();
        }
    };
    constructor(socket, instance) {
        this.socket = socket;
        this.instance = instance;
        socket.registerConnectionHandler(this.connectionChanged);
    }
    async providers() {
        const response = await timeout(this.socket.sendTo(this.instance, 'ai:providers', {}), 10_000);
        if (!Array.isArray(response?.providers))
            throw new Error('AI is unavailable. Update and start the webui adapter.');
        return response.providers;
    }
    async models(provider) {
        const response = await timeout(this.socket.sendTo(this.instance, 'ai:models', { provider }), 30_000);
        if (response?.error)
            throw new Error(response.error);
        return response?.models ?? [];
    }
    subscribe() {
        if (this.token)
            return Promise.resolve();
        return this.subscription ??= (async () => {
            const result = await timeout(this.socket.subscribeOnInstance(this.instance, 'aiChatAnswer', {}, this.pushed), 10_000);
            if (!result?.accepted || !result.session)
                throw new Error('Pushed AI answers are unavailable. Update ioBroker controller/web and the webui adapter.');
            if (this.disposed)
                throw new Error('AI client closed');
            this.token = result.session;
        })().catch(err => { this.subscription = null; throw err; });
    }
    async ask(provider, model, messages, tools, signal) {
        if (this.disposed)
            throw new Error('AI client closed');
        await timeout(this.subscribe(), 10_000, signal);
        signal?.throwIfAborted();
        const requestId = createAiId();
        let resolve, reject;
        const pushed = new Promise((res, rej) => { resolve = res; reject = rej; });
        // Register before sendTo: a quick model can push its answer before the acknowledgement.
        this.pending.set(requestId, { resolve, reject });
        const answer = timeout((async () => {
            const ack = await timeout(this.socket.sendTo(this.instance, 'ai:chat', {
                provider, model, messages, tools, uiSession: this.token, requestId, timeout: 600_000
            }), 30_000);
            return ack?.accepted ? pushed : ack;
        })(), 610_000, signal);
        // A lost connection may reject the push before the sendTo acknowledgement arrives.
        void pushed.catch(() => { });
        try {
            const result = await answer;
            if (typeof result === 'string')
                throw new Error(result);
            if (!result || 'error' in result)
                throw new Error(result && 'error' in result ? result.error : 'Empty AI response');
            return result;
        }
        finally {
            this.pending.delete(requestId);
        }
    }
    dispose() {
        this.disposed = true;
        this.socket.unregisterConnectionHandler(this.connectionChanged);
        void this.socket.unsubscribeFromInstance(this.instance, 'aiChatAnswer', this.pushed).catch(() => { });
        this.connectionChanged(false);
    }
}
