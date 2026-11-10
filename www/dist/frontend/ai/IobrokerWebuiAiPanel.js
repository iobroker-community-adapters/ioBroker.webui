import { runToolLoop } from '@iobroker/ai-core/build/shared/index.js';
import { AiClient } from './AiClient.js';
import { AiSessionStore } from './AiSessionStore.js';
import { AiToolContext, aiTools, webuiKnowledge } from './AiTools.js';
import { attachmentLimit, readAttachment, userMessage } from './AiAttachments.js';
import { createAiId } from './AiTypes.js';
import { AiTurnController, cancelPendingMessages } from './AiTurnController.js';
import { AiSpeechInput } from './AiSpeechInput.js';
const icon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const sendIcon = icon('<path d="M12 19V5m-6 6 6-6 6 6"/>');
const micIcon = icon('<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3m-3 0h6"/>');
export class IobrokerWebuiAiPanel extends HTMLElement {
    client;
    workspace;
    store;
    sessions = [];
    selected;
    draftSession = this.createDraft();
    providers = [];
    models = [];
    runs = new Map();
    activity = new Map();
    speech = new AiSpeechInput();
    storageError = false;
    disposed = false;
    initialized = false;
    saveTimer;
    modelLoad = 0;
    menuCleanup;
    $(selector) { return this.shadowRoot.querySelector(selector); }
    get session() { return this.sessions.find(session => session.id === this.selected) ?? this.draftSession; }
    createDraft(previous) {
        return { id: createAiId(), title: 'New chat', provider: previous?.provider ?? '', model: previous?.model ?? '', status: 'idle', messages: [], entries: [], proposals: [], attachments: [], draft: '', pendingMessages: [] };
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>
            :host { display:flex; flex-direction:column; height:100%; min-width:0; overflow:auto; color:var(--webui-text); background:var(--webui-surface); font:13px system-ui,sans-serif; }
            * { box-sizing:border-box; } [hidden] { display:none !important; }
            button,textarea,select { font:inherit; color:inherit; } button { cursor:pointer; }
            button:disabled { cursor:default; opacity:.4; } button:hover { background:var(--webui-hover); }
            button:focus-visible,textarea:focus-visible,select:focus-visible { outline:2px solid var(--webui-accent); outline-offset:1px; }
            button { border:0; border-radius:4px; background:transparent; padding:5px; } button svg { display:block; width:17px; height:17px; }
            #sessions { display:flex; flex-shrink:0; overflow:auto; padding:3px 6px; gap:2px; border-bottom:1px solid var(--webui-border); min-height:30px; }
            #sessions:empty { display:none; } #sessions button { display:flex; align-items:center; gap:5px; flex-shrink:0; max-width:180px; font-size:11px; padding:5px 7px; }
            #sessions button .name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            #sessions button[aria-pressed=true] { background:var(--webui-selected); box-shadow:inset 0 -1px var(--webui-accent); }
            .dot { width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; animation:pulse 1.2s ease-in-out infinite; }
            #notice:empty { display:none; } #notice { flex-shrink:0; max-height:65px; overflow:auto; margin:6px 10px; color:var(--webui-muted); font-size:12px; white-space:pre-wrap; }
            #messages { overflow:auto; flex:1; min-height:55px; padding:0 12px 8px; }
            .empty { padding:36px 5px; color:var(--webui-muted); } .empty h3 { color:var(--webui-text); font-size:15px; font-weight:500; margin:0 0 8px; } .empty p { line-height:1.6; margin:0; }
            article { margin:12px 0; line-height:1.5; overflow-wrap:anywhere; } article[data-role=user] { padding:8px 10px; border-radius:8px; background:var(--webui-selected); }
            article[data-role=tool] { margin:5px 0; color:var(--webui-muted); font-size:11px; } article[data-role=error] { border-left:2px solid #b55454; padding-left:8px; }
            article p { white-space:pre-wrap; margin:0; } article small { display:block; color:var(--webui-muted); font-size:10px; }
            #activity { display:flex; flex-shrink:0; gap:7px; align-items:center; padding:5px 12px; font-size:12px; color:var(--webui-muted); }
            .spinner { border:1.5px solid var(--webui-border); border-top-color:var(--webui-accent); border-radius:50%; width:12px; height:12px; animation:spin 1s linear infinite; }
            #proposals:empty { display:none; } #proposals { flex-shrink:0; min-height:32px; max-height:35%; overflow:auto; padding:0 12px; border-top:1px solid var(--webui-border); font-size:12px; }
            details { padding:7px 0; } summary { cursor:pointer; } pre { white-space:pre-wrap; overflow-wrap:anywhere; font:11px monospace; margin:6px 0; max-height:180px; overflow:auto; }
            #proposals button { border:1px solid var(--webui-border); margin:0 5px 5px 0; }
            footer { flex-shrink:0; padding:8px; } .composer { border:1px solid var(--webui-input-border); border-radius:8px; background:var(--webui-subtle); }
            .composer:focus-within { border-color:var(--webui-accent); }
            textarea { display:block; width:100%; border:0; outline:none; background:transparent; padding:10px; resize:vertical; min-height:76px; max-height:200px; line-height:1.5; }
            textarea:focus-visible { outline:none; } .controls { display:flex; align-items:center; gap:2px; padding:3px 5px 5px; flex-wrap:wrap; }
            .pickers { display:flex; flex:1; min-width:80px; overflow:hidden; align-items:center; }
            select { min-width:0; border:0; border-radius:3px; background:transparent; font-size:11px; height:25px; cursor:pointer; }
            select:hover { background:var(--webui-hover); } select option { color:var(--webui-text); background:var(--webui-surface); }
            #provider { max-width:72px; width:40%; } #model { flex:1; width:60%; } .actions { display:flex; gap:2px; margin-left:auto; }
            #send { background:var(--webui-selected); } #mic[aria-pressed=true] { background:#b5545433; color:#e18b8b; }
            #delivery { max-width:72px; font-size:10px; } #attachments { display:flex; gap:4px; flex-wrap:wrap; padding:0 8px; }
            #attachments:empty { display:none; } .attachment { display:flex; align-items:center; max-width:100%; padding-top:6px; font-size:11px; } .attachment img { width:32px; height:32px; object-fit:contain; }
            #pending:empty { display:none; } #pending { padding-bottom:5px; display:grid; gap:3px; }
            .pending { display:flex; align-items:center; gap:4px; font-size:11px; border:1px solid var(--webui-border); border-radius:4px; }
            .pending .edit { flex:1; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            #state { min-height:14px; margin-top:4px; color:var(--webui-muted); font-size:10px; }
            #menu { position:fixed; z-index:100000; min-width:160px; max-width:230px; padding:4px; border:1px solid var(--webui-input-border); border-radius:5px; background:var(--webui-surface); box-shadow:0 4px 16px var(--webui-dialog-shadow); }
            #menu button { display:block; width:100%; text-align:left; font-size:12px; }
            @keyframes spin { to { transform:rotate(360deg); } } @keyframes pulse { 50% { opacity:.35; } }
            @media(prefers-reduced-motion:reduce) { .spinner,.dot { animation:none; } }
        </style>
        <div id="sessions" role="group" aria-label="AI sessions" title="Click a selected chat to return to a fresh draft. Right-click for chat actions."></div>
        <div id="notice" role="status">Connecting to ioBroker AI…</div>
        <div id="messages" role="log" aria-label="Conversation" aria-live="polite"></div>
        <div id="activity" role="status" hidden><span class="spinner" aria-hidden="true"></span><span id="activity-text"></span></div>
        <div id="proposals" aria-label="Proposed screen changes"></div>
        <footer><div id="pending" aria-label="Pending messages"></div><div class="composer">
          <div id="attachments"></div><textarea id="prompt" rows="3" aria-label="Message to AI" placeholder="Describe your screen…"></textarea>
          <div class="controls"><button id="attach" type="button" title="Attach files" aria-label="Attach files">${icon('<path d="m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9a2 2 0 0 1 3 3l-8 8a1 1 0 0 1-2-2l7-7"/>')}</button>
            <input id="files" type="file" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,text/*,.json,.screen,.control,.js,.ts,.css,.html,.xml,.svg">
            <div class="pickers"><select id="provider" aria-label="AI provider"></select><select id="model" aria-label="AI model"></select></div>
            <div class="actions"><select id="delivery" aria-label="Send while running" title="How to send while the assistant is working" hidden><option value="steer">Steer</option><option value="queue">Queue</option></select>
              <button id="mic" type="button" aria-label="Start speech input" title="Dictate a message" aria-pressed="false">${micIcon}</button>
              <button id="stop" type="button" title="Stop request" aria-label="Stop request" hidden>${icon('<rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none"/>')}</button>
              <button id="send" type="button" title="Send message" aria-label="Send message">${sendIcon}</button></div>
          </div></div><div id="state" role="status"></div></footer><div id="menu" role="menu" hidden></div>`;
        this.$('#provider').onchange = () => { this.session.provider = this.$('#provider').value; this.session.model = ''; this.changed(); void this.loadModels(); };
        this.$('#model').onchange = () => { this.session.model = this.$('#model').value; this.$('#model').title = this.session.model; this.changed(); };
        this.$('#delivery').onchange = () => this.renderState();
        this.$('#send').onclick = () => void this.send();
        this.$('#stop').onclick = () => this.stop();
        this.$('#mic').onclick = () => this.dictate();
        this.$('#attach').onclick = () => this.$('#files').click();
        this.$('#files').onchange = () => { const input = this.$('#files'); void this.attach(Array.from(input.files)); input.value = ''; };
        this.$('#prompt').oninput = () => {
            this.speech.cancel();
            this.session.draft = this.$('#prompt').value;
            this.changed();
            this.renderState();
        };
        this.$('#prompt').onkeydown = event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                void this.send();
            }
        };
        this.$('#prompt').onpaste = event => {
            const files = Array.from(event.clipboardData?.files ?? []);
            if (files.length) {
                event.preventDefault();
                void this.attach(files);
            }
        };
        this.$('#sessions').oncontextmenu = event => { if (event.target === this.$('#sessions')) {
            event.preventDefault();
            this.showMenu(event.clientX, event.clientY);
        } };
        this.$('.composer').oncontextmenu = event => {
            if (event.target instanceof HTMLTextAreaElement)
                return;
            event.preventDefault();
            this.showMenu(event.clientX, event.clientY);
        };
        this.render();
    }
    async initialize(socket, instance, workspace) {
        if (this.initialized)
            return;
        this.initialized = true;
        this.workspace = workspace;
        this.client = new AiClient(socket, instance);
        let user = createAiId();
        try {
            user = await socket.getCurrentUser();
        }
        catch {
            this.storageError = true;
        }
        this.store = new AiSessionStore(`${location.origin}:${instance}:${user}`);
        try {
            const [saved, draft] = await Promise.all([this.store.load(), this.store.loadDraft()]);
            if (draft)
                this.draftSession = draft;
            this.sessions = saved.filter(session => session.messages.length || session.entries.length);
            for (const session of this.sessions) {
                cancelPendingMessages(session);
                if (session.status === 'running') {
                    session.status = 'stopped';
                    session.entries.push({ role: 'error', text: 'This turn was interrupted by a reload. It was not resumed.' });
                }
            }
        }
        catch {
            this.storageError = true;
        }
        if (this.disposed)
            return;
        this.render();
        this.changed();
        await this.refresh();
    }
    changed() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => { void this.store?.save(this.sessions, this.draftSession).catch(() => { this.storageError = true; this.renderState(); }); }, 150);
    }
    selectSession(id) {
        this.speech.cancel();
        this.closeMenu();
        if (!id || id === this.selected) {
            if (!this.draftSession.provider)
                this.draftSession = this.createDraft(this.session);
            this.selected = null;
        }
        else
            this.selected = id;
        this.notice('');
        this.render();
        void this.loadModels();
        this.$('#prompt').focus();
    }
    deleteSession(id) {
        this.runs.get(id)?.stop();
        this.sessions = this.sessions.filter(session => session.id !== id);
        if (this.selected === id)
            this.selected = null;
        this.render();
        this.changed();
        void this.loadModels();
    }
    showMenu(x, y, session) {
        this.closeMenu();
        const menu = this.$('#menu');
        menu.replaceChildren();
        const item = (text, action) => {
            const button = document.createElement('button');
            button.setAttribute('role', 'menuitem');
            button.textContent = text;
            button.onclick = () => { this.closeMenu(); action(); };
            menu.append(button);
        };
        item('Start a fresh draft', () => this.selectSession());
        if (session) {
            item('Rename chat…', () => { const name = prompt('Chat name', session.title); if (name?.trim()) {
                session.title = name.trim();
                this.changed();
                this.renderSessions();
            } });
            item(this.runs.has(session.id) ? 'Stop and delete chat' : 'Delete chat', () => this.deleteSession(session.id));
        }
        item('Reload providers and models', () => void this.refresh());
        menu.hidden = false;
        const bounds = menu.getBoundingClientRect();
        menu.style.left = Math.max(4, Math.min(x, innerWidth - bounds.width - 4)) + 'px';
        menu.style.top = Math.max(4, Math.min(y, innerHeight - bounds.height - 4)) + 'px';
        const dismiss = (event) => { if (!event.composedPath().includes(menu))
            this.closeMenu(); };
        const key = (event) => { if (event.key === 'Escape')
            this.closeMenu(); };
        document.addEventListener('pointerdown', dismiss, true);
        document.addEventListener('keydown', key, true);
        this.menuCleanup = () => { document.removeEventListener('pointerdown', dismiss, true); document.removeEventListener('keydown', key, true); };
        menu.querySelector('button')?.focus();
    }
    closeMenu() { this.menuCleanup?.(); this.menuCleanup = null; this.$('#menu').hidden = true; }
    notice(text) { this.$('#notice').textContent = text; }
    async refresh() {
        try {
            this.providers = (await this.client.providers()).map(provider => provider.provider);
            if (this.disposed)
                return;
            this.notice(this.providers.length ? '' : 'Configure AI in ioBroker Admin → System settings → AI.');
            this.renderProvider();
            await this.loadModels();
        }
        catch (error) {
            this.notice(String(error));
        }
    }
    renderProvider() {
        const select = this.$('#provider');
        select.replaceChildren();
        for (const provider of this.providers)
            select.add(new Option(provider, provider));
        if (!this.providers.includes(this.session.provider))
            this.session.provider = this.providers[0] || '';
        select.value = this.session.provider;
        select.title = this.session.provider || 'AI provider';
    }
    async loadModels() {
        const generation = ++this.modelLoad, session = this.session;
        this.models = [];
        this.renderModels();
        if (!session.provider || !this.client)
            return;
        try {
            const models = await this.client.models(session.provider);
            if (this.disposed || generation !== this.modelLoad || session !== this.session)
                return;
            this.models = models;
            if (!models.includes(session.model))
                session.model = models[0] ?? '';
            this.renderModels();
            this.changed();
        }
        catch (error) {
            if (session === this.session && generation === this.modelLoad)
                this.notice(String(error));
        }
    }
    renderModels() {
        const select = this.$('#model');
        select.replaceChildren();
        for (const model of this.models)
            select.add(new Option(model, model));
        select.value = this.session.model;
        select.title = this.session.model || 'AI model';
        this.renderState();
    }
    renderSessions() {
        const container = this.$('#sessions');
        container.replaceChildren();
        for (const session of this.sessions) {
            const button = document.createElement('button');
            if (session.status === 'running') {
                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.setAttribute('aria-hidden', 'true');
                button.append(dot);
            }
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = (session.status === 'error' ? '⚠ ' : '') + session.title;
            button.append(name);
            button.title = `${session.title} — ${session.status}. Right-click for actions.`;
            button.setAttribute('aria-pressed', String(session.id === this.selected));
            button.onclick = () => this.selectSession(session.id);
            button.oncontextmenu = event => { event.preventDefault(); event.stopPropagation(); this.showMenu(event.clientX, event.clientY, session); };
            button.onkeydown = event => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                event.preventDefault();
                const bounds = button.getBoundingClientRect();
                this.showMenu(bounds.left, bounds.bottom, session);
            } };
            container.append(button);
        }
    }
    renderState() {
        const running = this.runs.has(this.session.id), hasDraft = !!this.session.draft.trim() || !!this.session.attachments.length;
        const send = this.$('#send');
        send.disabled = !this.session.model || !this.client || !hasDraft;
        send.title = send.ariaLabel = running ? this.$('#delivery').value === 'queue' ? 'Queue message' : 'Send guidance while running' : 'Send message';
        this.$('#stop').hidden = !running;
        this.$('#delivery').hidden = !running;
        this.$('#provider').disabled = running || !this.providers.length;
        this.$('#model').disabled = running;
        const field = this.$('#prompt');
        field.placeholder = running ? 'Add guidance while the assistant works…' : this.selected ? 'Ask for a change…' : 'Describe your screen…';
        this.$('#activity').hidden = !running;
        this.$('#activity-text').textContent = this.activity.get(this.session.id) || 'Thinking…';
        this.$('#mic').setAttribute('aria-pressed', String(this.speech.listening));
        this.$('#mic').ariaLabel = this.speech.listening ? 'Stop speech input' : 'Start speech input';
        this.$('#mic').title = this.speech.listening ? 'Stop dictation' : this.speech.supported ? 'Dictate a message' : 'Speech input is not supported by this browser';
        this.$('#state').textContent = this.speech.listening ? 'Listening… speech is added to your draft.' : this.storageError ? 'Browser storage unavailable; keep this tab open.' : running ? `Enter to ${this.$('#delivery').value === 'queue' ? 'queue' : 'steer'} · Shift+Enter for a new line` : this.runs.size ? `${this.runs.size} other chat${this.runs.size === 1 ? '' : 's'} running` : 'Enter to send · Shift+Enter for a new line';
    }
    render() {
        this.renderSessions();
        this.$('#prompt').value = this.session.draft;
        this.renderProvider();
        this.renderModels();
        this.renderMessages();
        this.renderProposals();
        this.renderAttachments();
        this.renderPending();
    }
    renderMessages() {
        const container = this.$('#messages');
        const nearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 60;
        container.replaceChildren();
        if (!this.session.entries.length) {
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.innerHTML = '<h3>What would you like to build?</h3><p>Describe a screen, attach a reference, or dictate a message.</p><p>Select a chat above to continue it. Click the selected chat again for a fresh draft.</p>';
            container.append(empty);
        }
        for (const entry of this.session.entries) {
            const article = document.createElement('article');
            article.dataset.role = entry.role;
            article.setAttribute('aria-label', entry.role);
            const content = document.createElement('p');
            content.textContent = entry.text;
            article.append(content);
            if (entry.delivery) {
                const state = document.createElement('small');
                state.textContent = entry.delivery === 'steer' ? 'Steering · next safe step' : entry.delivery === 'queue' ? 'Queued · after this turn' : 'Not sent';
                article.append(state);
            }
            container.append(article);
        }
        if (nearBottom)
            container.scrollTop = container.scrollHeight;
    }
    renderPending() {
        const container = this.$('#pending');
        container.replaceChildren();
        for (const message of this.session.pendingMessages ?? []) {
            const row = document.createElement('div');
            row.className = 'pending';
            const edit = document.createElement('button');
            edit.className = 'edit';
            edit.textContent = `${message.mode === 'steer' ? 'Steer' : 'Queued'} · ${message.text}`;
            edit.title = 'Edit pending message';
            edit.onclick = () => { this.runs.get(this.session.id)?.remove(message.id); this.session.draft = message.draft ?? message.text; this.session.attachments = structuredClone(message.attachments ?? []); this.$('#prompt').value = this.session.draft; this.changed(); this.renderPending(); this.renderAttachments(); this.renderMessages(); this.renderState(); };
            const remove = document.createElement('button');
            remove.textContent = '×';
            remove.ariaLabel = 'Remove pending message';
            remove.onclick = () => { this.runs.get(this.session.id)?.remove(message.id); this.changed(); this.renderPending(); this.renderMessages(); };
            row.append(edit, remove);
            container.append(row);
        }
    }
    renderProposals() {
        const container = this.$('#proposals');
        container.replaceChildren();
        for (const proposal of this.session?.proposals ?? []) {
            const details = document.createElement('details');
            const title = document.createElement('summary');
            title.textContent = `${proposal.type}: ${proposal.name} — ${proposal.status}`;
            const before = document.createElement('pre');
            before.textContent = 'BEFORE\n' + JSON.stringify(proposal.before, null, 2);
            const after = document.createElement('pre');
            after.textContent = 'PROPOSED\n' + JSON.stringify(proposal.data, null, 2);
            const apply = document.createElement('button');
            apply.textContent = 'Apply to editor';
            apply.disabled = proposal.status !== 'pending' || this.session?.status === 'running';
            apply.onclick = async () => {
                apply.disabled = true;
                try {
                    await this.workspace.applyProposal(proposal);
                    proposal.status = 'applied';
                    this.notice('Applied to editor. Review the screen, then use Save to persist it.');
                    this.changed();
                    this.renderProposals();
                }
                catch (error) {
                    this.notice(String(error));
                    apply.disabled = false;
                }
            };
            const discard = document.createElement('button');
            discard.textContent = 'Discard';
            discard.disabled = proposal.status !== 'pending' || this.session?.status === 'running';
            discard.onclick = () => { proposal.status = 'discarded'; this.changed(); this.renderProposals(); };
            details.append(title, before, after, apply, discard);
            container.append(details);
        }
    }
    async attach(files) {
        const session = this.session;
        try {
            for (const file of files) {
                const attachment = await readAttachment(file);
                if (session.attachments.length >= 8 || session.attachments.reduce((sum, item) => sum + item.content.length, 0) + attachment.content.length > attachmentLimit * 1.4)
                    throw new Error('Limit: eight attachments and 10 MB total per message.');
                session.attachments.push(attachment);
            }
        }
        catch (error) {
            this.notice(String(error));
        }
        this.changed();
        if (session === this.session) {
            this.renderAttachments();
            this.renderState();
        }
    }
    renderAttachments() {
        const container = this.$('#attachments');
        container.replaceChildren();
        for (const [index, attachment] of this.session.attachments.entries()) {
            const row = document.createElement('span');
            row.className = 'attachment';
            if (attachment.type.startsWith('image/')) {
                const image = document.createElement('img');
                image.src = attachment.content;
                image.alt = attachment.name;
                row.append(image);
            }
            const button = document.createElement('button');
            button.textContent = `${attachment.name} ×`;
            button.title = 'Remove attachment';
            button.onclick = () => { this.session.attachments.splice(index, 1); this.changed(); this.renderAttachments(); this.renderState(); };
            row.append(button);
            container.append(row);
        }
    }
    dictate() {
        if (this.speech.listening) {
            this.speech.stop();
            return;
        }
        const session = this.session, field = this.$('#prompt');
        const before = session.draft.slice(0, field.selectionStart), after = session.draft.slice(field.selectionEnd);
        this.speech.start(navigator.language || 'en', {
            text: text => { session.draft = before + (before && !/\s$/.test(before) ? ' ' : '') + text + after; if (session === this.session)
                field.value = session.draft; this.changed(); this.renderState(); },
            changed: () => this.renderState(), error: message => this.notice(message)
        });
        field.focus();
    }
    stop() {
        this.runs.get(this.session.id)?.stop();
        this.notice('Stopped. The current provider request may finish in the background.');
        this.activity.set(this.session.id, 'Stopping…');
        this.renderPending();
        this.renderState();
        this.changed();
    }
    async send() {
        const session = this.session;
        if (!this.client || !session.provider || !session.model || (!session.draft.trim() && !session.attachments.length))
            return;
        this.speech.cancel();
        let message;
        try {
            if (session.provider === 'anthropic' && session.messages.some(message => Array.isArray(message.content)))
                throw new Error('This chat contains screenshots. Choose a vision-capable OpenAI-compatible provider, or use a fresh text-only draft for Anthropic.');
            message = userMessage(session.draft, session.attachments, session.provider);
        }
        catch (error) {
            this.notice(String(error));
            return;
        }
        const text = session.draft + session.attachments.map(attachment => `\n📎 ${attachment.name}`).join('');
        const run = this.runs.get(session.id);
        if (run) {
            const id = createAiId(), mode = this.$('#delivery').value;
            run.add({ id, mode, message, text, draft: session.draft, attachments: structuredClone(session.attachments) });
            session.entries.push({ role: 'user', text, pendingId: id, delivery: mode });
            session.draft = '';
            session.attachments = [];
            this.render();
            this.changed();
            return;
        }
        if (!this.sessions.includes(session)) {
            session.title = session.draft.trim().slice(0, 45) || 'Attachments';
            this.sessions.unshift(session);
            this.selected = session.id;
            this.draftSession = this.createDraft(session);
        }
        session.messages.push(message);
        session.entries.push({ role: 'user', text });
        session.draft = '';
        session.attachments = [];
        session.status = 'running';
        const controller = new AiTurnController(session);
        this.runs.set(session.id, controller);
        const provider = session.provider, model = session.model;
        const context = new AiToolContext(this.workspace, session.proposals);
        const selected = this.workspace.selectedDocument();
        this.notice('');
        this.render();
        this.changed();
        const refresh = () => {
            this.changed();
            this.renderSessions();
            this.renderState();
            if (session === this.session) {
                this.renderMessages();
                this.renderProposals();
                this.renderPending();
            }
        };
        try {
            await controller.run({
                loop: runToolLoop,
                systemPrompt: webuiKnowledge + `\nCurrent editor: ${selected ? JSON.stringify(selected) : 'no document selected'}.`,
                tools: aiTools,
                ask: (messages, tools, signal) => { this.activity.set(session.id, 'Thinking…'); refresh(); return this.client.ask(provider, model, messages, tools, signal); },
                runTool: async (call, args) => {
                    const label = call.function.name.replaceAll('_', ' ');
                    this.activity.set(session.id, label + '…');
                    session.entries.push({ role: 'tool', text: label + '…', pendingId: call.id });
                    refresh();
                    return context.run(call.function.name, args);
                },
                onAnswer: answer => { if (answer.content) {
                    session.entries.push({ role: 'assistant', text: answer.content });
                    refresh();
                } },
                onToolResult: (call, result) => {
                    const entry = session.entries.find(entry => entry.role === 'tool' && entry.pendingId === call.id);
                    if (entry)
                        entry.text = result.startsWith('Error:') ? result : call.function.name.replaceAll('_', ' ') + ' ✓';
                    refresh();
                }, changed: refresh
            });
            session.status = controller.abort.signal.aborted ? 'stopped' : 'idle';
        }
        catch (error) {
            cancelPendingMessages(session);
            session.status = controller.abort.signal.aborted ? 'stopped' : 'error';
            if (!controller.abort.signal.aborted)
                session.entries.push({ role: 'error', text: String(error) });
        }
        finally {
            this.runs.delete(session.id);
            this.activity.delete(session.id);
            refresh();
        }
    }
    stopSpeechInput() { this.speech.cancel(); this.renderState(); }
    disconnectedCallback() { queueMicrotask(() => { if (!this.isConnected)
        this.dispose(); }); }
    dispose() {
        this.disposed = true;
        this.speech.cancel();
        this.closeMenu();
        for (const run of this.runs.values())
            run.stop();
        this.client?.dispose();
        clearTimeout(this.saveTimer);
        void this.store?.save(this.sessions, this.draftSession).catch(() => { });
    }
}
customElements.define('iobroker-webui-ai-panel', IobrokerWebuiAiPanel);
