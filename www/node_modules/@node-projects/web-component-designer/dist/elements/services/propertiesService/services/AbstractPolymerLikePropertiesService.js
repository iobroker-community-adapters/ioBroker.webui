import { PropertiesHelper } from './PropertiesHelper.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
export class AbstractPolymerLikePropertiesService extends AbstractPropertiesService {
    getRefreshMode(designItem) {
        return RefreshMode.fullOnClassChange;
    }
    async getProperties(designItem) {
        if (!this.isHandledElement(designItem))
            return null;
        if (designItem.element?.constructor?.properties)
            return this.parseProperties(designItem.element.constructor.properties);
        return null;
    }
    parseProperties(list) {
        let groups = [];
        let names = Object.keys(list);
        const grouped = Object.groupBy(names, x => list[x].group ?? '');
        for (let grp in grouped) {
            const pg = { name: grp, properties: [] };
            for (const name of grouped[grp]) {
                const polymerProperty = list[name];
                let type = polymerProperty;
                let description = null;
                let example = null;
                let readonly = false;
                let propertyType = PropertyType.propertyAndAttribute;
                if (polymerProperty.type) {
                    type = polymerProperty.type;
                    description = polymerProperty.description;
                    example = polymerProperty.example;
                    readonly = polymerProperty.readonly;
                    propertyType = polymerProperty.readonly ? PropertyType.property : PropertyType.propertyAndAttribute;
                }
                if (type === String) {
                    let property = { name, type: "string", service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else if (type === Object) {
                    let property = { name, type: "object", service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else if (type === Number) {
                    let property = { name, type: "number", service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else if (type === Date) {
                    let property = { name, type: "date", service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else if (type === Boolean) {
                    let property = { name, type: "boolean", service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else if (PropertiesHelper.isTypescriptEnum(type)) {
                    let property = { name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(type), service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else if (typeof type === 'string') {
                    let property = { name, type: type, service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
                else {
                    let property = { name, type: "string", service: this, propertyType, description, example, readonly };
                    pg.properties.push(property);
                }
            }
            if (pg.name == '')
                //@ts-ignore
                groups.push(...pg.properties);
            else
                //@ts-ignore
                groups.push(pg);
        }
        return groups;
    }
    getUnsetValue(designItems, property) {
        return designItems[0].element[property.propertyName ?? property.name];
    }
}
//# sourceMappingURL=AbstractPolymerLikePropertiesService.js.map