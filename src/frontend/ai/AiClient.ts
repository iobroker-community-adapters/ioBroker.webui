import { createAiId } from './AiTypes.js';
import type { Connection } from '@iobroker/socket-client';
import type { AiProvider, OpenAIMessage, OpenAITool } from '@iobroker/ai-core/build/shared/types.js';
import type { AiChatResponse, AiProvidersResponse, AiSubscribeResponse } from '@iobroker/ai-core/build/shared/protocol.js';

function timeout<T>(job: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason);
    let timer: ReturnType<typeof setTimeout>;
    let abort: () => void;
    return Promise.race([job, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('The AI adapter did not answer in time.')), ms);
        abort = () => reject(signal.reason);
        signal?.addEventListener('abort', abort, { once: true });
    })]).finally(() => { clearTimeout(timer); signal?.removeEventListener('abort', abort); });
}

/** Same ai-core push protocol as vis-2, without a React dependency. */
export class AiClient {
    private token: string;
    private subscription: Promise<void>;
    private disposed = false;
    private readonly pending = new Map<string, { resolve: (answer: AiChatResponse) => void; reject: (error: Error) => void }>();
    private readonly pushed = (data: unknown) => {
        const answer = data as AiChatResponse & { requestId?: string };
        if (answer?.requestId) this.pending.get(answer.requestId)?.resolve(answer);
    };
    private readonly connectionChanged = (connected: boolean) => {
        if (!connected) {
            this.token = null;
            this.subscription = null;
            for (const job of this.pending.values()) job.reject(new Error('Connection lost. Retry after reconnecting.'));
            this.pending.clear();
        }
    };

    constructor(private readonly socket: Connection, private readonly instance: string) {
        socket.registerConnectionHandler(this.connectionChanged);
    }

    async providers() {
        const response = await timeout(this.socket.sendTo<AiProvidersResponse>(this.instance, 'ai:providers', {}), 10_000);
        if (!Array.isArray(response?.providers)) throw new Error('AI is unavailable. Update and start the webui adapter.');
        return response.providers;
    }
    async models(provider: AiProvider): Promise<string[]> {
        const response = await timeout(this.socket.sendTo<{ models?: string[]; error?: string }>(this.instance, 'ai:models', { provider }), 30_000);
        if (response?.error) throw new Error(response.error);
        return response?.models ?? [];
    }
    private subscribe(): Promise<void> {
        if (this.token) return Promise.resolve();
        return this.subscription ??= (async () => {
            const result = await timeout(this.socket.subscribeOnInstance<AiSubscribeResponse>(this.instance, 'aiChatAnswer', {}, this.pushed), 10_000);
            if (!result?.accepted || !result.session) throw new Error('Pushed AI answers are unavailable. Update ioBroker controller/web and the webui adapter.');
            if (this.disposed) throw new Error('AI client closed');
            this.token = result.session;
        })().catch(err => { this.subscription = null; throw err; });
    }
    async ask(provider: AiProvider, model: string, messages: OpenAIMessage[], tools?: OpenAITool[], signal?: AbortSignal) {
        if (this.disposed) throw new Error('AI client closed');
        await timeout(this.subscribe(), 10_000, signal);
        signal?.throwIfAborted();
        const requestId = createAiId();
        let resolve: (answer: AiChatResponse) => void, reject: (error: Error) => void;
        const pushed = new Promise<AiChatResponse>((res, rej) => { resolve = res; reject = rej; });
        // Register before sendTo: a quick model can push its answer before the acknowledgement.
        this.pending.set(requestId, { resolve, reject });
        const answer = timeout((async (): Promise<AiChatResponse> => {
            const ack = await timeout(this.socket.sendTo<AiChatResponse & { accepted?: boolean }>(this.instance, 'ai:chat', {
                provider, model, messages, tools, uiSession: this.token, requestId, timeout: 600_000
            }), 30_000);
            return ack?.accepted ? pushed : ack;
        })(), 610_000, signal);
        // A lost connection may reject the push before the sendTo acknowledgement arrives.
        void pushed.catch(() => { });
        try {
            const result = await answer;
            if (typeof result === 'string') throw new Error(result);
            if (!result || 'error' in result) throw new Error(result && 'error' in result ? result.error : 'Empty AI response');
            return result;
        } finally { this.pending.delete(requestId); }
    }
    dispose() {
        this.disposed = true;
        this.socket.unregisterConnectionHandler(this.connectionChanged);
        void this.socket.unsubscribeFromInstance(this.instance, 'aiChatAnswer', this.pushed).catch(() => { });
        this.connectionChanged(false);
    }
}
