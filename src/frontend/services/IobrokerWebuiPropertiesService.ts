import { BaseCustomWebComponentPropertiesService, IDesignItem, IProperty, PropertyType } from "@node-projects/web-component-designer";
import { BaseCustomControl } from "../runtime/CustomControls.js";
import { IControl } from "../interfaces/IControl.js";

export class IobrokerWebuiPropertiesService extends BaseCustomWebComponentPropertiesService {
    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof BaseCustomControl;
    }

    public override getProperties(designItem: IDesignItem): IProperty[] {
        if (!this.isHandledElement(designItem))
            return null;
        return this.parseProperties((<any>designItem.element.constructor)._control);
    }

    protected parseProperties(control: IControl): IProperty[] {
        let properties: IProperty[] = [];
        for (const name in control.properties) {
            let type = control.properties[name];
            if (type === 'string') {
                let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (type === 'color') {
                let property: IProperty = { name: name, type: "color", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (type === 'number') {
                let property: IProperty = { name: name, type: "number", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (type === 'date') {
                let property: IProperty = { name: name, type: "date", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (type === 'color') {
                let property: IProperty = { name: name, type: "color", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (type === 'boolean') {
                let property: IProperty = { name: name, type: "boolean", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (type.startsWith("[")) {
                let property: IProperty = { name: name, type: "list", values: <string[]>JSON.parse(type), service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else {
                let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            }
        }
        return properties;
    }
}