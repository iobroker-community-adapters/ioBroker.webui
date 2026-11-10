import type { OpenAIMessage, AiProvider } from '@iobroker/ai-core/build/shared/types.js';
import type { IScreen } from '../interfaces/IScreen.js';

export type DocumentType = 'screen' | 'control';
export interface AiDocument { type: DocumentType; name: string; data: IScreen; }
export interface AiProposal extends AiDocument {
    before: IScreen | null;
    status: 'pending' | 'applied' | 'discarded';
}
export interface AiAttachment { name: string; type: string; content: string; }
export interface AiEntry { role: 'user' | 'assistant' | 'tool' | 'error'; text: string; pendingId?: string; proposalKey?: string; delivery?: 'steer' | 'queue' | 'cancelled'; }
export interface AiPendingMessage { id: string; message: OpenAIMessage; text: string; mode: 'steer' | 'queue'; draft?: string; attachments?: AiAttachment[]; }
export interface AiSession {
    id: string;
    title: string;
    unread?: boolean;
    provider: AiProvider | '';
    model: string;
    status: 'idle' | 'running' | 'error' | 'stopped';
    messages: OpenAIMessage[];
    entries: AiEntry[];
    proposals: AiProposal[];
    attachments: AiAttachment[];
    draft: string;
    pendingMessages?: AiPendingMessage[];
}

export interface AiWorkspace {
    listDocuments(type: DocumentType): Promise<string[]>;
    readDocument(type: DocumentType, name: string): Promise<IScreen | null>;
    applyProposal(proposal: AiProposal): Promise<void>;
    selectedDocument(): { type: DocumentType; name: string } | null;
    globalContext(): unknown;
    elements(): Promise<unknown>;
    installedPackages(): Promise<Record<string, string>>;
    addPackage(name: string): Promise<unknown>;
    searchObjects(type: string, query: string, offset: number, limit: number): Promise<unknown>;
    readObject(id: string): Promise<unknown>;
    readState(id: string): Promise<unknown>;
}

export function documentKey(type: DocumentType, name: string): string { return type + ':' + name; }
export function sameDocument(a: IScreen | null, b: IScreen | null): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

/** randomUUID is unavailable on the plain HTTP URLs commonly used by ioBroker. */
export function createAiId(source: Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>> = globalThis.crypto): string {
    if (source.randomUUID) return source.randomUUID();
    return Array.from(source.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
}
