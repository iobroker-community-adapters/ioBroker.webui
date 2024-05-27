import { PropertyType } from '../PropertyType.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
export class CommonPropertiesService extends AbstractPropertiesService {
    getRefreshMode(designItem) {
        return RefreshMode.none;
    }
    //@ts-ignore
    commonProperties = [
        {
            name: "class",
            type: "string",
            service: this,
            attributeName: "class",
            propertyName: "className",
            propertyType: PropertyType.attribute
        }, {
            name: "title",
            type: "string",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        }, {
            name: "part",
            type: "string",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        }, {
            name: "tabindex",
            type: "number",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        }
    ];
    name = "common";
    isHandledElement(designItem) {
        return !designItem.isRootItem;
    }
    async getProperty(designItem, name) {
        return this.commonProperties.find(x => x.name == name);
    }
    async getProperties(designItem) {
        return this.commonProperties;
    }
}
//# sourceMappingURL=CommonPropertiesService.js.map