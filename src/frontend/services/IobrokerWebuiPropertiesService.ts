import { BaseCustomWebComponentPropertiesService, IDesignItem, IProperty, PropertyType } from "@node-projects/web-component-designer";
import { BaseCustomControl, CustomControlInfo, webuiCustomControlSymbol } from "../runtime/CustomControls.js";
import { IControl } from "../interfaces/IControl.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { SignalPropertyEditor } from "@node-projects/web-component-designer-visualization-addons";
import { ScreenViewer } from "../runtime/ScreenViewer.js";

export class IobrokerWebuiPropertiesService extends BaseCustomWebComponentPropertiesService {
    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof BaseCustomControl || designItem.element instanceof ScreenViewer;;
    }

    public override async getProperties(designItem: IDesignItem): Promise<IProperty[]> {
        if (!this.isHandledElement(designItem))
            return null;

        let properties: IProperty[] = [];
        if (designItem.element instanceof BaseCustomControl) {
            let control: IControl = (<CustomControlInfo>(<any>designItem.element.constructor)[webuiCustomControlSymbol]).control;
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
                    let property: IProperty = { name: name, type: "signal", service: this, propertyType: PropertyType.propertyAndAttribute, createEditor: p => new SignalPropertyEditor(p, window.appShell) };
                    properties.push(property);
                } else if (prp.type == 'screen') {
                    const screens = await iobrokerHandler.getAllNames('screen');
                    let property: IProperty = { name: name, type: "list", values: screens, service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                } else {
                    let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
            }
            return properties;
        } else {
            const screens = await iobrokerHandler.getAllNames('screen');
            properties.push({ name: 'screenName', type: "list", values: screens, service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'relativeSignalsPath', type: "string", service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretch', type: "list", values: ['none', 'fill', 'uniform', 'uniformToFill'], service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretchWidth', type: "number", service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretchHeight', type: "number", service: this, propertyType: PropertyType.propertyAndAttribute });
            return properties;
        }
    }
}