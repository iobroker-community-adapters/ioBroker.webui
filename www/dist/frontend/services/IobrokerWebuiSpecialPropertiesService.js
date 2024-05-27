import { NativeElementsPropertiesService, PropertyType } from "@node-projects/web-component-designer";
export class IobrokerWebuiSpecialPropertiesService extends NativeElementsPropertiesService {
    isHandledElement(designItem) {
        return designItem.element instanceof HTMLInputElement;
    }
    async getProperties(designItem) {
        if (!this.isHandledElement(designItem))
            return null;
        let props = await super.getProperties(designItem);
        let idx = props.findIndex(p => p.name === 'valueAsNumber');
        props.splice(idx + 1, 0, {
            name: 'valueAsNumberLocal',
            type: "number",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        });
        return props;
    }
}
