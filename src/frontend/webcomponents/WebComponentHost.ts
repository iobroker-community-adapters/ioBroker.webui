/**
 * Host side of the ioBroker web component contract (`@iobroker/web-components`) for webui.
 *
 * A component is placed in a screen as `<iobroker-webui-web-component adapter="flow" component="flow-diagram">`.
 * Each value-carrying setting of its manifest is an attribute `setting-<dash-case name>`, so the designer can edit and
 * bind every setting on its own. This module touches no DOM, so tests can use it in Node.
 */
import {
    getDefaultSettings,
    getSettingTypes,
    getSettingsGroups,
    getText,
    resolveManifestUrl,
    toSettings,
    DECORATION_TYPES,
    type LoadedWebComponent,
    type WebComponentManifest,
    type WebComponentSettings,
    type WebComponentSettingType,
} from '@iobroker/web-components';

export const webComponentHostTag = 'iobroker-webui-web-component';
export const settingAttributePrefix = 'setting-';
export const webComponentThemes = ['light', 'dark', 'auto'] as const;

type Lang = ioBroker.Languages;

/** Attribute that stores a setting: `textTrue` -> `setting-text-true` */
export function settingAttributeName(key: string): string {
    return settingAttributePrefix + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
}

/**
 * The settings object for the element from the attributes of the host element.
 *
 * A checkbox is a boolean attribute like in HTML (and like a webui attribute binding writes it): present means
 * true unless it says `false`; absent means false. Other settings without an attribute are left out.
 */
export function readSettings(manifest: WebComponentManifest, getAttribute: (name: string) => string | null): WebComponentSettings {
    const types = getSettingTypes(manifest);
    const values: Record<string, unknown> = {};
    for (const [key, type] of Object.entries(types)) {
        const raw = getAttribute(settingAttributeName(key));
        if (type === 'checkbox')
            values[key] = raw != null && raw !== 'false' && raw !== '0';
        else if (raw != null)
            values[key] = raw;
    }
    return toSettings(types, values);
}

/** True if both settings objects hold the same values */
export function sameSettings(a: WebComponentSettings | null | undefined, b: WebComponentSettings | null | undefined): boolean {
    if (!a || !b)
        return a === b;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.is(a[key], b[key]));
}

/** The attributes of a new instance: the component and the defaults of its settings */
export function getDefaultAttributes(component: Pick<LoadedWebComponent, 'adapter' | 'manifest'>): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (component.adapter)
        attributes.adapter = component.adapter;
    attributes.component = component.manifest.tag;
    const types = getSettingTypes(component.manifest);
    for (const [key, value] of Object.entries(getDefaultSettings(component.manifest))) {
        if (types[key] === 'checkbox') {
            if (value === true || value === 'true')
                attributes[settingAttributeName(key)] = '';
        } else if (value !== undefined && value !== null) {
            attributes[settingAttributeName(key)] = String(value);
        }
    }
    return attributes;
}

/** A palette entry of the designer (shape of `IElementDefinition`) */
export interface WebComponentElementDefinition {
    tag: string;
    name: string;
    description: string;
    icon?: string;
    defaultWidth?: string;
    defaultHeight?: string;
    defaultAttributes: Record<string, string>;
}

export function getElementDefinition(component: LoadedWebComponent, lang: Lang): WebComponentElementDefinition {
    const manifest = component.manifest;
    const settings = Object.entries(getSettingTypes(manifest)).map(([key, type]) => `${settingAttributeName(key)} (${type})`);
    const description = [
        getText(manifest.description, lang),
        `ioBroker web component <${manifest.tag}>${component.adapter ? ' of the adapter ' + component.adapter : ''}.`,
        settings.length ? 'Settings are attributes: ' + settings.join(', ') + '.' : '',
    ].filter(Boolean).join(' ');
    let icon: string;
    try {
        icon = resolveManifestUrl(manifest.icon, component.url);
    } catch {
        icon = undefined;
    }
    return {
        tag: webComponentHostTag,
        name: getText(manifest.name, lang) || manifest.tag,
        description,
        icon,
        defaultWidth: manifest.size?.width ? manifest.size.width + 'px' : undefined,
        defaultHeight: manifest.size?.height ? manifest.size.height + 'px' : undefined,
        defaultAttributes: getDefaultAttributes(component),
    };
}

/**
 * Evaluates a JSON-Config `hidden` / `disabled` expression over the values of all settings.
 * A broken expression counts as false, so the field stays usable.
 */
export function evaluateCondition(expression: string | undefined, data: WebComponentSettings): boolean {
    if (!expression)
        return false;
    try {
        const fn = new Function('data', '_system', '_alive', '_common', 'globalData', 'arrayIndex', 'return (' + expression + ');');
        return !!fn(data ?? {}, {}, true, {}, data ?? {}, 0);
    } catch {
        return false;
    }
}

export interface WebComponentSettingDescription {
    key: string;
    attribute: string;
    type: WebComponentSettingType;
    label: string;
    help?: string;
    default?: string | number | boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: [label: string, value: string][];
    adapter?: string;
    disabled: boolean;
}

export interface WebComponentSettingsGroupDescription {
    name: string;
    settings: WebComponentSettingDescription[];
}

/**
 * The settings to edit, grouped like the manifest (one group per tab), without decorations and without the
 * settings that are hidden for the given values.
 */
export function describeSettings(manifest: WebComponentManifest, lang: Lang, data: WebComponentSettings): WebComponentSettingsGroupDescription[] {
    const groups: WebComponentSettingsGroupDescription[] = [];
    for (const group of getSettingsGroups(manifest)) {
        const settings: WebComponentSettingDescription[] = [];
        for (const [key, setting] of Object.entries(group.panel.items ?? {})) {
            if (!setting || DECORATION_TYPES.includes(setting.type))
                continue;
            if (evaluateCondition(setting.hidden, data))
                continue;
            settings.push({
                key,
                attribute: settingAttributeName(key),
                type: setting.type,
                label: getText(setting.label, lang) || key,
                help: getText(setting.help, lang) || undefined,
                default: setting.default,
                min: setting.min,
                max: setting.max,
                step: setting.step,
                options: setting.options?.map(option => [getText(option.label, lang) || String(option.value), String(option.value)]),
                adapter: setting.adapter,
                disabled: evaluateCondition(setting.disabled, data),
            });
        }
        if (settings.length)
            groups.push({ name: group.name === 'common' ? 'settings' : (getText(group.label, lang) || group.name), settings });
    }
    return groups;
}

/** Finds a component by tag, preferring the one of the given adapter */
export function findComponent<T extends Pick<LoadedWebComponent, 'adapter' | 'manifest'>>(components: T[], adapter: string | null, tag: string | null): T | undefined {
    if (!tag)
        return undefined;
    return components.find(c => c.manifest.tag === tag && (!adapter || c.adapter === adapter))
        ?? components.find(c => c.manifest.tag === tag);
}

/**
 * True if the node is shown inside the designer canvas (through shadow roots and iframes), so the component gets
 * `editMode`. The live preview and the runtime are not inside a canvas.
 */
export function isInsideDesignerCanvas(node: Node): boolean {
    let current: Node = node;
    while (current) {
        const root = current.getRootNode();
        if (root.nodeType === 11 && (root as ShadowRoot).host) {
            const host = (root as ShadowRoot).host;
            if (host.localName === 'node-projects-designer-canvas')
                return true;
            current = host;
        } else {
            let frame: Element = null;
            try {
                frame = (root as Document).defaultView?.frameElement ?? null;
            } catch {
                frame = null;
            }
            current = frame;
        }
    }
    return false;
}
