import { AbstractPropertiesService, IDesignItem, IProperty, IPropertyGroup, PropertyType, RefreshMode } from '@node-projects/web-component-designer';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { IobrokerWebuiSignalPropertyEditor } from '../config/IobrokerWebuiSignalPropertyEditor.js';
import { describeSettings, findComponent, readSettings, webComponentHostTag, webComponentThemes, type WebComponentSettingDescription } from '../webcomponents/WebComponentHost.js';
import { getWebComponentLanguage, loadInstalledWebComponents } from '../webcomponents/WebComponentRegistry.js';

const instanceCache = new Map<string, Promise<string[]>>();

/** IDs like `flow.0` of the instances of an adapter, or of all adapters */
function getInstanceIds(adapter?: string): Promise<string[]> {
    const key = adapter ?? '';
    let ids = instanceCache.get(key);
    if (!ids) {
        const start = 'system.adapter.' + (adapter ? adapter + '.' : '');
        ids = iobrokerHandler.connection.getObjectViewSystem('instance', start, start + '\u9999')
            .then(instances => Object.keys(instances ?? {}).map(id => id.substring('system.adapter.'.length)).sort())
            .catch(() => { instanceCache.delete(key); return []; });
        instanceCache.set(key, ids);
    }
    return ids;
}

/**
 * Properties of `<iobroker-webui-web-component>`: the component, its theme and every setting of its manifest as an
 * attribute `setting-<name>` - so each setting can be edited and bound on its own.
 */
export class IobrokerWebuiWebComponentPropertiesService extends AbstractPropertiesService {
    public name = 'iobrokerWebComponent';

    constructor() {
        super(false);
    }

    override getRefreshMode(designItem: IDesignItem): RefreshMode {
        // settings can hide or disable others
        return RefreshMode.fullOnValueChange;
    }

    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element?.localName === webComponentHostTag;
    }

    override async getProperties(designItem: IDesignItem): Promise<IPropertyGroup[]> {
        if (!this.isHandledElement(designItem))
            return null;

        const groups: IPropertyGroup[] = [{
            name: 'component',
            properties: [
                { name: 'component', type: 'string', readonly: true, service: this, propertyType: PropertyType.attribute, description: 'Tag of the ioBroker web component' },
                { name: 'adapter', type: 'string', readonly: true, service: this, propertyType: PropertyType.attribute, description: 'Adapter that brings the component' },
                { name: 'theme', type: 'list', values: [...webComponentThemes], defaultValue: 'light', service: this, propertyType: PropertyType.attribute, description: 'light, dark or auto (follows the browser). --iob-* CSS custom properties override single colors.' },
            ],
        }];

        const components = await loadInstalledWebComponents();
        const component = findComponent(components, designItem.getAttribute('adapter'), designItem.getAttribute('component'));
        if (!component)
            return groups;

        const data = readSettings(component.manifest, name => designItem.getAttribute(name));
        for (const group of describeSettings(component.manifest, getWebComponentLanguage(), data)) {
            const properties: IProperty[] = [];
            for (const setting of group.settings)
                properties.push(await this.#createProperty(setting));
            groups.push({ name: group.name, properties });
        }
        return groups;
    }

    async #createProperty(setting: WebComponentSettingDescription): Promise<IProperty> {
        const property: IProperty = {
            name: setting.attribute,
            attributeName: setting.attribute,
            displayName: setting.label,
            description: (setting.help ? setting.help + ' ' : '') + `(setting "${setting.key}", ${setting.type})`,
            type: 'string',
            readonly: setting.disabled,
            defaultValue: setting.default,
            service: this,
            propertyType: PropertyType.attribute,
        };
        switch (setting.type) {
            case 'number':
            case 'slider':
                property.type = 'number';
                property.min = setting.min;
                property.max = setting.max;
                property.step = setting.step;
                break;
            case 'checkbox':
                // a boolean attribute: absent means false
                property.type = 'boolean';
                property.defaultValue = false;
                break;
            case 'color':
                property.type = 'color';
                break;
            case 'select':
                property.type = 'enum';
                property.enumValues = setting.options ?? [];
                break;
            case 'objectId':
                property.type = 'signal';
                property.createEditor = p => new IobrokerWebuiSignalPropertyEditor(p, window.appShell);
                break;
            case 'instance':
                property.type = 'list';
                property.values = ['', ...await getInstanceIds(setting.adapter)];
                break;
        }
        return property;
    }
}
