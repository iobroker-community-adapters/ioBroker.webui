export function documentKey(type, name) { return type + ':' + name; }
export function sameDocument(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
/** randomUUID is unavailable on the plain HTTP URLs commonly used by ioBroker. */
export function createAiId(source = globalThis.crypto) {
    if (source.randomUUID)
        return source.randomUUID();
    return Array.from(source.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
}
