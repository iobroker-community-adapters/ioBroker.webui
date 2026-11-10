/** Keep object/collection references, but inline scalar aliases for property-grid editors. */
export function inlineSchemaScalars(schema) {
    const scalar = new Set(['string', 'number', 'integer', 'boolean', 'null']);
    const resolve = (ref, seen = new Set()) => {
        if (typeof ref !== 'string' || !ref.startsWith('#/') || seen.has(ref)) return null;
        seen.add(ref);
        const target = ref.slice(2).split('/').reduce((node, part) => node?.[part.replaceAll('~1', '/').replaceAll('~0', '~')], schema);
        if (!target || typeof target !== 'object') return null;
        if (target.$ref) {
            const base = resolve(target.$ref, seen);
            if (!base) return null;
            const { $ref: _ref, ...overrides } = target;
            return { ...base, ...overrides };
        }
        return scalar.has(target.type) ? target : null;
    };
    const visit = value => {
        if (Array.isArray(value)) return value.map(visit);
        if (!value || typeof value !== 'object') return value;
        const base = resolve(value.$ref);
        const { $ref, ...overrides } = value;
        const result = base ? { ...base, ...overrides } : value;
        return Object.fromEntries(Object.entries(result).map(([key, item]) => [key, ['default', 'enum', 'const', 'examples', 'example'].includes(key) ? structuredClone(item) : visit(item)]));
    };
    return visit(schema);
}
