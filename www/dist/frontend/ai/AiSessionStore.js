/** Browser-local, per-installation conversations. Storage errors leave the chat usable in memory. */
export class AiSessionStore {
    scope;
    database;
    constructor(scope) {
        this.scope = scope;
    }
    open() {
        return this.database ??= new Promise((resolve, reject) => {
            const request = indexedDB.open('webui-ai-sessions', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('sessions');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async loadDraft() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const request = db.transaction('sessions').objectStore('sessions').get(this.scope + ':draft');
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    }
    async load() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const request = db.transaction('sessions').objectStore('sessions').get(this.scope);
            request.onsuccess = () => resolve(request.result ?? []);
            request.onerror = () => reject(request.error);
        });
    }
    async save(sessions, draft) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('sessions', 'readwrite');
            const objects = transaction.objectStore('sessions');
            objects.put(sessions, this.scope);
            if (draft?.draft || draft?.attachments.length)
                objects.put(draft, this.scope + ':draft');
            else
                objects.delete(this.scope + ':draft');
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
        });
    }
}
