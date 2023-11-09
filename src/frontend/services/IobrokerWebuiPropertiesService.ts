import { BaseCustomWebComponentPropertiesService, IDesignItem, IProperty, PropertyType } from "@node-projects/web-component-designer";
import { BaseCustomControl, CustomControlInfo, webuiCustomControlSymbol } from "../runtime/CustomControls.js";
import { IControl } from "../interfaces/IControl.js";
import { IobrokerSignalPropertyEditor } from "./IobrokerSignalPropertyEditor.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiPropertiesService extends BaseCustomWebComponentPropertiesService {
    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof BaseCustomControl;
    }

    public override getProperties(designItem: IDesignItem): IProperty[] {
        if (!this.isHandledElement(designItem))
            return null;
        let control: IControl = (<CustomControlInfo>(<any>designItem.element.constructor)[webuiCustomControlSymbol]).control;

        let properties: IProperty[] = [];
        for (const name in control.properties) {
            let prp = control.properties[name];
            if (prp.type === 'string') {
                let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type === 'color') {
                let property: IProperty = { name: name, type: "color", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type === 'number') {
                let property: IProperty = { name: name, type: "number", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type === 'date') {
                let property: IProperty = { name: name, type: "date", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type === 'color') {
                let property: IProperty = { name: name, type: "color", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type === 'boolean') {
                let property: IProperty = { name: name, type: "boolean", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type == 'enum') {
                let property: IProperty = { name: name, type: "list", values: prp.values, service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else if (prp.type == 'signal') {
                let property: IProperty = { name: name, type: "signal", service: this, propertyType: PropertyType.propertyAndAttribute, createEditor: p => new IobrokerSignalPropertyEditor(p) };
                properties.push(property);
            } else if (prp.type == 'screen') {
                //TODO: hack, getProperties should be async in designer
                let property: IProperty = { name: name, type: "list", values: (<any>iobrokerHandler)._screenNames, service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            } else {
                let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                properties.push(property);
            }
        }
        return properties;
    }
}