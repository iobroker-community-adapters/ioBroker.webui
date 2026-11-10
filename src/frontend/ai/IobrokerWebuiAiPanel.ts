import { runToolLoop } from '@iobroker/ai-core/build/shared/index.js';
import type { AiProvider } from '@iobroker/ai-core/build/shared/types.js';
import type { Connection } from '@iobroker/socket-client';
import { AiClient } from './AiClient.js';
import { AiSessionStore } from './AiSessionStore.js';
import { AiToolContext, aiTools, webuiKnowledge } from './AiTools.js';
import { attachmentLimit, readAttachment, userMessage } from './AiAttachments.js';
import { createAiId, type AiSession, type AiWorkspace } from './AiTypes.js';

export class IobrokerWebuiAiPanel extends HTMLElement {
    private client: AiClient;
    private workspace: AiWorkspace;
    private store: AiSessionStore;
    private sessions: AiSession[] = [];
    private selected: string;
    private providers: AiProvider[] = [];
    private models: string[] = [];
    private runs = new Map<string, { stopped: boolean }>();
    private storageError = false;
    private disposed = false;
    private initialized = false;
    private saveTimer: ReturnType<typeof setTimeout>;
    private modelLoad = 0;
    private $<T extends HTMLElement>(selector: string): T { return this.shadowRoot.querySelector<T>(selector); }
    private get session() { return this.sessions.find(x => x.id === this.selected); }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>
            :host { display:flex; flex-direction:column; height:100%; min-width:0; overflow:auto; color:var(--webui-text); background:var(--webui-surface); font:13px system-ui,sans-serif; }
            * { box-sizing:border-box; }
            button,input,textarea,select { font:inherit; color:inherit; background:var(--webui-surface); border:1px solid var(--webui-input-border); border-radius:4px; padding:6px; }
            button { cursor:pointer; } button:hover { background:var(--webui-hover); } button:disabled { cursor:default; opacity:.5; }
            button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible { outline:2px solid var(--webui-accent); outline-offset:1px; }
            header, .models, footer { flex-shrink:0; padding:8px; border-bottom:1px solid var(--webui-border); }
            header { display:flex; gap:5px; flex-wrap:wrap; } header input { flex:1; min-width:80px; width:100px; }
            #sessions { display:flex; gap:5px; overflow:auto; padding:6px 8px; border-bottom:1px solid var(--webui-border); min-height:43px; }
            #sessions button { flex-shrink:0; max-width:190px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            #sessions button[aria-pressed=true] { background:var(--webui-selected); border-color:var(--webui-accent); }
            .models { display:flex; gap:5px; flex-wrap:wrap; } label { display:flex; gap:4px; align-items:center; flex:1; min-width:100px; } select { width:100%; min-width:0; }
            #notice { flex-shrink:0; max-height:66px; overflow:auto; padding:6px 10px; color:var(--webui-muted); font-size:12px; white-space:pre-wrap; }
            #messages { overflow:auto; flex:1; min-height:50px; padding:0 10px 10px; }
            article { margin:10px 0; padding:9px; border:1px solid var(--webui-border); border-radius:6px; background:var(--webui-subtle); }
            article[data-role=user] { background:var(--webui-selected); } article[data-role=error] { border-color:#b55454; }
            article strong { display:block; font-size:11px; text-transform:uppercase; margin-bottom:5px; }
            article p, pre { white-space:pre-wrap; overflow-wrap:anywhere; margin:0; font:inherit; }
            article[data-role=tool] { padding:6px 9px; font-size:12px; }
            #proposals:empty { display:none; }
            #proposals { flex-shrink:0; min-height:36px; max-height:35%; overflow:auto; padding:0 10px; border-top:1px solid var(--webui-border); }
            details { padding:8px 0; } summary { cursor:pointer; } pre { font:11px monospace; margin:6px 0; max-height:200px; overflow:auto; }
            #attachments { display:flex; gap:5px; flex-wrap:wrap; padding-bottom:5px; } .attachment { display:flex; gap:4px; align-items:center; max-width:100%; } .attachment img { width:36px; height:36px; object-fit:contain; }
            footer { border-top:1px solid var(--webui-border); border-bottom:0; } textarea { width:100%; resize:vertical; min-height:64px; max-height:200px; }
            .actions { display:flex; gap:6px; margin-top:6px; } #send { margin-left:auto; background:var(--webui-selected); } #state { font-size:12px; margin-top:4px; color:var(--webui-muted); }
        </style>
        <header><input id="title" aria-label="Session name"><button id="new" title="New session">New chat</button><button id="delete" title="Delete selected session">Delete</button></header>
        <div id="sessions" role="group" aria-label="AI sessions"></div>
        <div class="models"><label>Provider<select id="provider" aria-label="AI provider"></select></label><label>Model<select id="model" aria-label="AI model"></select></label><button id="refresh" title="Reload AI providers and models">↻</button></div>
        <div id="notice" role="status">Connecting to ioBroker AI…</div>
        <div id="messages" role="log" aria-label="Conversation" aria-live="polite"></div>
        <div id="proposals" aria-label="Proposed screen changes"></div>
        <footer><div id="attachments"></div><textarea id="prompt" aria-label="Message to AI" placeholder="Describe a screen or a change… Paste screenshots here."></textarea>
        <div class="actions"><button id="attach">Attach files</button><input id="files" type="file" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,text/*,.json,.screen,.control,.js,.ts,.css,.html,.xml,.svg"><button id="stop" hidden>Stop</button><button id="send">Send</button></div>
        <div id="state" role="status"></div></footer>`;
        this.$('#new').onclick = () => this.newSession();
        this.$('#delete').onclick = () => this.deleteSession();
        this.$<HTMLInputElement>('#title').onchange = () => { this.session.title = this.$<HTMLInputElement>('#title').value.trim() || 'New chat'; this.changed(); this.renderSessions(); };
        this.$<HTMLSelectElement>('#provider').onchange = () => { this.session.provider = this.$<HTMLSelectElement>('#provider').value as AiProvider; this.session.model = ''; this.changed(); void this.loadModels(); };
        this.$<HTMLSelectElement>('#model').onchange = () => { this.session.model = this.$<HTMLSelectElement>('#model').value; this.changed(); };
        this.$('#refresh').onclick = () => void this.refresh();
        this.$('#send').onclick = () => void this.send();
        this.$('#stop').onclick = () => this.stop();
        this.$('#attach').onclick = () => this.$<HTMLInputElement>('#files').click();
        this.$<HTMLInputElement>('#files').onchange = () => { const input = this.$<HTMLInputElement>('#files'); void this.attach(Array.from(input.files)); input.value = ''; };
        this.$<HTMLTextAreaElement>('#prompt').oninput = () => { if (this.session) { this.session.draft = this.$<HTMLTextAreaElement>('#prompt').value; this.changed(); } };
        this.$('#prompt').onkeydown = event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); void this.send(); } };
        this.$('#prompt').onpaste = event => {
            const files = Array.from(event.clipboardData?.files ?? []);
            if (files.length) { event.preventDefault(); void this.attach(files); }
        };
    }

    async initialize(socket: Connection, instance: string, workspace: AiWorkspace) {
        if (this.initialized) return;
        this.initialized = true;
        this.workspace = workspace;
        this.client = new AiClient(socket, instance);
        // Separate installations, adapter instances and logged-in users share no chat history.
        let user: string = createAiId();
        try { user = await socket.getCurrentUser(); } catch { this.storageError = true; }
        this.store = new AiSessionStore(`${location.origin}:${instance}:${user}`);
        try {
            this.sessions = await this.store.load();
            for (const session of this.sessions) if (session.status === 'running') {
                session.status = 'stopped';
                session.entries.push({ role: 'error', text: 'This turn was interrupted by a reload. It was not resumed.' });
            }
        } catch { this.storageError = true; }
        if (this.disposed) return;
        if (!this.sessions.length) this.newSession();
        else { this.selected = this.sessions[0].id; this.render(); }
        await this.refresh();
    }
    private changed() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            void this.store?.save(this.sessions).catch(() => { this.storageError = true; this.renderState(); });
        }, 150);
    }
    private newSession() {
        const previous = this.session;
        const session: AiSession = { id: createAiId(), title: 'New chat', provider: previous?.provider || this.providers[0] || '', model: previous?.model || '', status: 'idle', messages: [], entries: [], proposals: [], attachments: [], draft: '' };
        this.sessions.unshift(session); this.selected = session.id;
        this.render(); this.changed();
        if (this.client) void this.loadModels();
    }
    private deleteSession() {
        if (this.runs.has(this.selected)) { this.notice('Stop this chat before deleting it.'); return; }
        if (!confirm('Delete this chat and its proposals from this browser?')) return;
        this.sessions = this.sessions.filter(x => x.id !== this.selected);
        if (!this.sessions.length) this.newSession();
        else { this.selected = this.sessions[0].id; this.render(); void this.loadModels(); }
        this.changed();
    }
    private notice(text: string) { this.$('#notice').textContent = text; }
    private async refresh() {
        try {
            this.providers = (await this.client.providers()).map(x => x.provider);
            if (this.disposed) return;
            this.notice(this.providers.length ? 'Changes are proposals. Apply them to the editor, then Save. Chats stay in this browser.' : 'Configure AI in ioBroker Admin → System settings → AI. Local ai-server/Ollama can be configured as a compatible endpoint.');
            this.renderProvider(); await this.loadModels();
        } catch (error) { this.notice(String(error)); }
    }
    private renderProvider() {
        const select = this.$<HTMLSelectElement>('#provider'); select.replaceChildren();
        for (const provider of this.providers) select.add(new Option(provider, provider));
        if (this.session) {
            if (!this.providers.includes(this.session.provider as AiProvider)) this.session.provider = this.providers[0] || '';
            select.value = this.session.provider;
        }
        select.disabled = !this.providers.length || this.session?.status === 'running';
    }
    private async loadModels() {
        const generation = ++this.modelLoad, session = this.session;
        this.models = []; this.renderModels();
        if (!session?.provider) return;
        try {
            const models = await this.client.models(session.provider);
            if (this.disposed || generation !== this.modelLoad || session !== this.session) return;
            this.models = models;
            if (!models.includes(session.model)) session.model = models[0] ?? '';
            this.renderModels(); this.changed();
        } catch (error) { if (session === this.session && generation === this.modelLoad) this.notice(String(error)); }
    }
    private renderModels() {
        const select = this.$<HTMLSelectElement>('#model'); select.replaceChildren();
        for (const model of this.models) select.add(new Option(model, model));
        select.value = this.session?.model || '';
        select.disabled = this.session?.status === 'running';
        this.renderState();
    }
    private renderSessions() {
        const container = this.$('#sessions'); container.replaceChildren();
        for (const session of this.sessions) {
            const button = document.createElement('button');
            button.textContent = `${session.status === 'running' ? '● ' : session.status === 'error' ? '⚠ ' : ''}${session.title}`;
            button.title = `${session.title} — ${session.status}`;
            button.setAttribute('aria-pressed', String(session.id === this.selected));
            button.onclick = () => { this.selected = session.id; this.render(); void this.loadModels(); };
            container.append(button);
        }
    }
    private renderState() {
        const running = this.session?.status === 'running';
        this.$<HTMLButtonElement>('#send').disabled = !this.session?.model || running || !this.client;
        this.$('#stop').hidden = !running;
        this.$<HTMLButtonElement>('#delete').disabled = !!running;
        this.$<HTMLButtonElement>('#attach').disabled = !!running;
        this.$<HTMLTextAreaElement>('#prompt').disabled = !!running;
        this.$<HTMLSelectElement>('#provider').disabled = !!running || !this.providers.length;
        this.$<HTMLSelectElement>('#model').disabled = !!running;
        this.$('#state').textContent = `${this.session?.status ?? 'idle'} · ${this.runs.size} running${this.storageError ? ' · Browser storage unavailable; keep this tab open.' : ''}`;
    }
    private render() {
        this.renderSessions();
        this.$<HTMLInputElement>('#title').value = this.session?.title || '';
        this.$<HTMLTextAreaElement>('#prompt').value = this.session?.draft || '';
        this.renderProvider(); this.renderModels(); this.renderMessages(); this.renderProposals(); this.renderAttachments();
    }
    private renderMessages() {
        const container = this.$('#messages'); container.replaceChildren();
        for (const entry of this.session?.entries ?? []) {
            const article = document.createElement('article'); article.dataset.role = entry.role;
            const label = document.createElement('strong'); label.textContent = entry.role;
            const content = document.createElement('p'); content.textContent = entry.text;
            article.append(label, content); container.append(article);
        }
        container.scrollTop = container.scrollHeight;
    }
    private renderProposals() {
        const container = this.$('#proposals'); container.replaceChildren();
        for (const proposal of this.session?.proposals ?? []) {
            const details = document.createElement('details');
            const title = document.createElement('summary'); title.textContent = `${proposal.type}: ${proposal.name} — ${proposal.status}`;
            const before = document.createElement('pre'); before.textContent = 'BEFORE\n' + JSON.stringify(proposal.before, null, 2);
            const after = document.createElement('pre'); after.textContent = 'PROPOSED\n' + JSON.stringify(proposal.data, null, 2);
            const apply = document.createElement('button'); apply.textContent = 'Apply to editor'; apply.disabled = proposal.status !== 'pending' || this.session?.status === 'running';
            apply.onclick = async () => {
                apply.disabled = true;
                try { await this.workspace.applyProposal(proposal); proposal.status = 'applied'; this.notice('Applied to editor. Review the screen, then use Save to persist it.'); this.changed(); this.renderProposals(); }
                catch (error) { this.notice(String(error)); apply.disabled = false; }
            };
            const discard = document.createElement('button'); discard.textContent = 'Discard'; discard.disabled = proposal.status !== 'pending' || this.session?.status === 'running';
            discard.onclick = () => { proposal.status = 'discarded'; this.changed(); this.renderProposals(); };
            details.append(title, before, after, apply, discard); container.append(details);
        }
    }
    private async attach(files: File[]) {
        const session = this.session;
        if (!session || session.status === 'running') return;
        try {
            for (const file of files) {
                const attachment = await readAttachment(file);
                if (session.attachments.length >= 8 || session.attachments.reduce((sum, x) => sum + x.content.length, 0) + attachment.content.length > attachmentLimit * 1.4) throw new Error('Limit: eight attachments and 10 MB total per message.');
                session.attachments.push(attachment);
            }
        } catch (error) { this.notice(String(error)); }
        this.changed(); if (session === this.session) this.renderAttachments();
    }
    private renderAttachments() {
        const container = this.$('#attachments'); container.replaceChildren();
        for (const [index, attachment] of (this.session?.attachments ?? []).entries()) {
            const row = document.createElement('span'); row.className = 'attachment';
            if (attachment.type.startsWith('image/')) { const image = document.createElement('img'); image.src = attachment.content; image.alt = attachment.name; row.append(image); }
            const button = document.createElement('button'); button.textContent = `${attachment.name} ×`; button.title = 'Remove attachment';
            button.disabled = this.session?.status === 'running';
            button.onclick = () => { this.session.attachments.splice(index, 1); this.changed(); this.renderAttachments(); };
            row.append(button); container.append(row);
        }
    }
    private stop() {
        const run = this.runs.get(this.selected);
        if (run) { run.stopped = true; this.notice('Stopping after the current provider response. No further tools will run.'); }
    }
    private async send() {
        const session = this.session;
        if (!session || this.runs.has(session.id) || !session.provider || !session.model || (!session.draft.trim() && !session.attachments.length)) return;
        let message;
        try {
            if (session.provider === 'anthropic' && session.messages.some(message => Array.isArray(message.content))) throw new Error('This chat contains screenshots. Choose a vision-capable OpenAI-compatible provider, or start a text-only chat for Anthropic.');
            message = userMessage(session.draft, session.attachments, session.provider); }
        catch (error) { this.notice(String(error)); return; }
        const target = this.workspace.selectedDocument();
        const prompt = `Current editor: ${target ? JSON.stringify(target) : 'no document selected'}.`;
        session.messages.push(message);
        session.entries.push({ role: 'user', text: session.draft + session.attachments.map(x => `\n📎 ${x.name}`).join('') });
        if (session.title === 'New chat') session.title = session.draft.slice(0, 45) || 'Attachments';
        session.draft = ''; session.attachments = []; session.status = 'running';
        const provider = session.provider as AiProvider, model = session.model;
        const run = { stopped: false }; this.runs.set(session.id, run);
        const context = new AiToolContext(this.workspace, session.proposals);
        this.notice('Working with the selected provider…');
        this.render(); this.changed();
        const refresh = () => { this.changed(); this.renderSessions(); this.renderState(); if (session === this.session) { this.renderMessages(); this.renderProposals(); } };
        try {
            const result = await runToolLoop({
                messages: [{ role: 'system', content: webuiKnowledge + '\n' + prompt }, ...session.messages],
                tools: aiTools, maxRounds: 20, finalAnswerWithoutTools: true,
                shouldStop: () => run.stopped || this.disposed,
                ask: async (messages, tools) => this.client.ask(provider, model, messages, tools),
                runTool: async (call, args) => {
                    if (run.stopped || this.disposed) throw new Error('Turn stopped; tool was not executed.');
                    session.entries.push({ role: 'tool', text: `Running ${call.function.name}…` }); refresh();
                    return context.run(call.function.name, args);
                },
                onAnswer: answer => { if (answer.content) { session.entries.push({ role: 'assistant', text: answer.content }); refresh(); } },
                onToolResult: (call, result) => { session.entries.push({ role: 'tool', text: `${call.function.name}: ${result.startsWith('Error:') ? result : 'done'}` }); refresh(); }
            });
            session.messages.push(...result.newMessages);
            session.status = result.stopped ? 'stopped' : 'idle';
            if (session === this.session) this.notice(result.stopped ? 'Stopped. Any staged changes remain available for review.' : 'Ready. Review any proposed changes below.');
        } catch (error) {
            session.status = 'error'; session.entries.push({ role: 'error', text: String(error) });
            // A failed turn's incomplete tool transcript must not poison the next provider request.
        } finally { this.runs.delete(session.id); refresh(); }
    }
    disconnectedCallback() {
        queueMicrotask(() => { if (!this.isConnected) this.dispose(); });
    }
    dispose() {
        this.disposed = true;
        for (const run of this.runs.values()) run.stopped = true;
        this.client?.dispose(); clearTimeout(this.saveTimer);
        void this.store?.save(this.sessions).catch(() => { });
    }
}
customElements.define('iobroker-webui-ai-panel', IobrokerWebuiAiPanel);
