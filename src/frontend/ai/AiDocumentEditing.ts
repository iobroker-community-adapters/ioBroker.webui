import { parse, type HTMLElement as ParsedElement } from '@node-projects/node-html-parser-esm';

export interface ElementReference { path?: number[]; selector?: string; }
/** Paths count authored element children, excluding text/comments and designer overlays. */
export function patchElementAttributes(html: string, reference: ElementReference, attributes: Record<string, unknown>): string {
    const root = parse(html, { comment: true });
    let element: ParsedElement;
    if (reference.path !== undefined) {
        if (!Array.isArray(reference.path) || !reference.path.length || reference.path.length > 64 || reference.path.some(n => !Number.isInteger(n) || n < 0)) throw new Error('Use a nonempty element path returned by get_editor_context.');
        element = root;
        for (const index of reference.path) {
            element = element.childNodes.filter(node => node.nodeType === 1)[index] as ParsedElement;
            if (!element) throw new Error('Element path does not exist in the read snapshot.');
        }
    } else {
        if (typeof reference.selector !== 'string' || !reference.selector || reference.selector.length > 500) throw new Error('Provide an element path or a unique CSS selector.');
        const match = reference.selector.match(/^(?:([a-zA-Z][\w-]*))?([#.])?([\w:.-]+)?$/);
        if (!match || (!match[2] && match[3])) throw new Error('Use a simple #id, .class or tag selector, or an element path.');
        const matches: ParsedElement[] = [];
        const visit = (parent: ParsedElement) => {
            for (const node of parent.childNodes) {
                if (node.nodeType !== 1) continue;
                const child = node as ParsedElement;
                const tag = match[1]?.toLowerCase();
                const identity = match[2] === '#' ? child.getAttribute('id') === match[3] : match[2] === '.' ? (child.getAttribute('class') ?? '').split(/\s+/).includes(match[3]) : true;
                if ((!tag || child.rawTagName.toLowerCase() === tag) && identity) matches.push(child);
                visit(child);
            }
        };
        visit(root);
        if (matches.length !== 1) throw new Error(`Selector must match exactly one element (matched ${matches.length}).`);
        element = matches[0];
    }
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes) || Object.keys(attributes).length > 50) throw new Error('attributes must be an object with at most 50 changes.');
    for (const [name, value] of Object.entries(attributes)) {
        if (!/^[^\s"'<>/=\x00-\x1f]+$/.test(name) || name.length > 240) throw new Error('Invalid attribute name');
        if (value === null) element.removeAttribute(name);
        else if (typeof value === 'string' && value.length <= 100_000) element.setAttribute(name, value);
        else throw new Error('Attribute values must be strings, or null to remove.');
    }
    return root.toString();
}

export function pageItems<T>(items: T[], offset = 0, limit = 50) {
    offset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
    limit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 50;
    return { total: items.length, offset, items: items.slice(offset, offset + limit), nextOffset: offset + limit < items.length ? offset + limit : null };
}
export function textChunk(value: string, offset = 0, limit = 12000) {
    offset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
    limit = Number.isFinite(limit) ? Math.max(1, Math.min(30000, Math.floor(limit))) : 12000;
    return { total: value.length, offset, text: value.slice(offset, offset + limit), nextOffset: offset + limit < value.length ? offset + limit : null };
}
