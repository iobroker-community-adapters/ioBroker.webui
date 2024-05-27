import { CommonPropertiesService } from './CommonPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
export class MathMLElementsPropertiesService extends CommonPropertiesService {
    commonMathProperties = [
        {
            name: "displaystyle",
            type: "boolean",
            service: this,
            defaultValue: true,
            propertyType: PropertyType.propertyAndAttribute
        }
    ];
    mathProperties = [
        {
            name: "display",
            type: "list",
            values: ["block", "inline"],
            service: this,
            defaultValue: "text",
            propertyType: PropertyType.propertyAndAttribute
        }
    ];
    mfracProperties = [
        {
            name: "denomalign",
            type: "list",
            values: ["left", "center", "right"],
            service: this,
            defaultValue: "center",
            propertyType: PropertyType.propertyAndAttribute
        },
        {
            name: "linethickness",
            type: "string",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        },
        {
            name: "numalign",
            type: "list",
            values: ["left", "center", "right"],
            service: this,
            defaultValue: "center",
            propertyType: PropertyType.propertyAndAttribute
        },
    ];
    name = "mathml";
    getRefreshMode(designItem) {
        return RefreshMode.full;
    }
    isHandledElement(designItem) {
        return designItem.element instanceof designItem.window.MathMLElement;
    }
    async getProperty(designItem, name) {
        return (await this.getProperties(designItem)).find(x => x.name == name);
    }
    async getProperties(designItem) {
        if (!this.isHandledElement(designItem))
            return null;
        switch (designItem.element.localName) {
            case 'math':
                return [...this.commonMathProperties, ...this.mathProperties];
            case 'merror':
                return [...this.commonMathProperties];
            case 'mfrac':
                return [...this.commonMathProperties, ...this.mfracProperties];
            default:
                return [...this.commonMathProperties];
        }
    }
}
//# sourceMappingURL=MathMLElementsPropertiesService.js.map