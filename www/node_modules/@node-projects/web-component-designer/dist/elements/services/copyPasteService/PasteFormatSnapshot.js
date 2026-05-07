import { PropertiesHelper } from "../propertiesService/services/PropertiesHelper.js";
export const pasteFormatKinds = ['all', 'border', 'background', 'transform', 'text'];
const explicitTextProperties = new Set([
    'color',
    'caret-color',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'white-space',
    'word-break',
    'overflow-wrap',
    'hyphens',
    'tab-size',
    'direction',
    'writing-mode',
    'unicode-bidi'
]);
const explicitTransformProperties = new Set([
    'translate',
    'rotate',
    'scale'
]);
function isBorderProperty(name) {
    return name.startsWith('border');
}
function isBackgroundProperty(name) {
    return name.startsWith('background');
}
function isTransformProperty(name) {
    return name === 'transform'
        || name.startsWith('transform-')
        || explicitTransformProperties.has(name);
}
function isTextProperty(name) {
    return name.startsWith('font')
        || name.startsWith('text')
        || explicitTextProperties.has(name);
}
function collectEntries(style, predicate) {
    const entries = [];
    const seen = new Set();
    for (let index = 0; index < style.length; index++) {
        const name = PropertiesHelper.camelToDashCase(style[index]);
        if (!name || seen.has(name) || !predicate(name)) {
            continue;
        }
        const value = style.getPropertyValue(name)?.trim();
        if (!value) {
            continue;
        }
        seen.add(name);
        entries.push({ name, value });
    }
    return entries;
}
function createPasteFormatSnapshotFromNormalizedEntries(entries) {
    const border = entries.filter(x => isBorderProperty(x.name));
    const background = entries.filter(x => isBackgroundProperty(x.name));
    const transform = entries.filter(x => isTransformProperty(x.name));
    const text = entries.filter(x => isTextProperty(x.name));
    const all = [];
    const seen = new Set();
    for (const group of [border, background, transform, text]) {
        for (const entry of group) {
            if (seen.has(entry.name)) {
                continue;
            }
            seen.add(entry.name);
            all.push(entry);
        }
    }
    return { all, border, background, transform, text };
}
export function createPasteFormatSnapshot(style) {
    const entries = collectEntries(style, () => true);
    return createPasteFormatSnapshotFromNormalizedEntries(entries);
}
export function createPasteFormatSnapshotFromEntries(entries) {
    const normalizedEntries = [];
    const seen = new Set();
    for (const [rawName, rawValue] of entries) {
        const name = rawName?.trim().toLowerCase();
        const value = rawValue?.trim();
        if (!name || !value || seen.has(name)) {
            continue;
        }
        seen.add(name);
        normalizedEntries.push({ name, value });
    }
    if (!normalizedEntries.length) {
        return null;
    }
    return createPasteFormatSnapshotFromNormalizedEntries(normalizedEntries);
}
export function getPasteFormatEntries(snapshot, kind) {
    return snapshot[kind];
}
//# sourceMappingURL=PasteFormatSnapshot.js.map