/** Export public manifest facts, never implementation code or private fields. */
export function componentApi(manifest, tag) {
    for (const module of manifest.modules ?? []) {
        const exported = module.exports?.find((entry) => entry.kind === 'custom-element-definition' && entry.name === tag);
        const definition = module.declarations?.find((entry) => entry.tagName === tag || (exported && entry.name === exported.declaration?.name));
        if (!definition)
            continue;
        return { tag, description: String(definition.description ?? '').slice(0, 2000),
            properties: (definition.members ?? []).filter((entry) => entry.kind === 'field' && (!entry.privacy || entry.privacy === 'public') && !entry.static).map((entry) => ({ name: entry.name, type: entry.type?.text, attribute: entry.attribute, default: entry.default, description: String(entry.description ?? '').slice(0, 500) })),
            attributes: (definition.attributes ?? []).map((entry) => ({ name: entry.name, type: entry.type?.text, fieldName: entry.fieldName, default: entry.default })),
            events: (definition.events ?? []).map((entry) => ({ name: entry.name, type: entry.type?.text, description: String(entry.description ?? '').slice(0, 500) })),
            slots: definition.slots ?? [], cssParts: definition.cssParts ?? [], cssProperties: definition.cssProperties ?? [] };
    }
    return null;
}
/** APIs owned by webui; keep aligned with runtime components and the property service. */
export function webuiComponentApi(tag) {
    if (tag === 'iobroker-webui-screen-viewer')
        return {
            source: 'runtime/ScreenViewer.ts and services/IobrokerWebuiPropertiesService.ts',
            properties: [{ name: 'screenName', type: 'string', description: 'Name from list_documents screen.' }, { name: 'relativeSignalsPath', type: 'string' },
                { name: 'stretch', type: 'enum', values: ['none', 'fill', 'uniform', 'uniformToFill'] }, { name: 'stretchWidth', type: 'number' }, { name: 'stretchHeight', type: 'number' }, { name: 'useStyleFromScreenForViewer', type: 'boolean' }]
        };
    if (tag === 'iobroker-webui-hab-panel-like-menu')
        return {
            source: 'runtime/HabPanelLikeMenu.ts', properties: [{ name: 'screens', type: 'string[]' }, { name: 'expanded', type: 'boolean' }], slots: ['menu', 'head', '']
        };
    return null;
}
