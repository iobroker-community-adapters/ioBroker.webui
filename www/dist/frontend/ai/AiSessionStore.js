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
    async load() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const request = db.transaction('sessions').objectStore('sessions').get(this.scope);
            request.onsuccess = () => resolve(request.result ?? []);
            request.onerror = () => reject(request.error);
        });
    }
    async save(sessions) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('sessions', 'readwrite');
            transaction.objectStore('sessions').put(sessions, this.scope);
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
        });
    }
}
