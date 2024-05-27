import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { PropertiesHelper } from './PropertiesHelper.js';
export class BasicWebcomponentPropertiesService extends AbstractPropertiesService {
    name = "webcomponent";
    getRefreshMode(designItem) {
        return RefreshMode.full;
    }
    isHandledElement(designItem) {
        //@ts-ignore
        const attr = designItem.element.constructor?.observedAttributes;
        if (attr && attr.length > 0) {
            return true;
        }
        return false;
    }
    async getProperty(designItem, name) {
        return (await this.getProperties(designItem)).find(x => x.name == name);
    }
    async getProperties(designItem) {
        //@ts-ignore
        const attr = designItem.element.constructor?.observedAttributes;
        return attr.map(x => ({
            name: PropertiesHelper.dashToCamelCase(x),
            type: "string",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        }));
    }
}
//# sourceMappingURL=BasicWebcomponentPropertiesService.js.map