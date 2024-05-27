import { BaseCustomWebComponentPropertiesService, PropertyType } from "@node-projects/web-component-designer";
import { BaseCustomControl, webuiCustomControlSymbol } from "../runtime/CustomControls.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { SignalPropertyEditor } from "@node-projects/web-component-designer-visualization-addons";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
export class IobrokerWebuiPropertiesService extends BaseCustomWebComponentPropertiesService {
    isHandledElement(designItem) {
        return designItem.element instanceof BaseCustomControl || designItem.element instanceof ScreenViewer;
        ;
    }
    async getProperties(designItem) {
        if (!this.isHandledElement(designItem))
            return null;
        let properties = [];
        if (designItem.element instanceof BaseCustomControl) {
            let control = designItem.element.constructor[webuiCustomControlSymbol].control;
            for (const name in control.properties) {
                let prp = control.properties[name];
                if (prp.type === 'string') {
                    let property = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type === 'color') {
                    let property = { name: name, type: "color", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type === 'number') {
                    let property = { name: name, type: "number", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type === 'date') {
                    let property = { name: name, type: "date", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type === 'color') {
                    let property = { name: name, type: "color", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type === 'boolean') {
                    let property = { name: name, type: "boolean", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type == 'enum') {
                    let property = { name: name, type: "list", values: prp.values, service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else if (prp.type == 'signal') {
                    let property = { name: name, type: "signal", service: this, propertyType: PropertyType.propertyAndAttribute, createEditor: p => new SignalPropertyEditor(p, window.appShell) };
                    properties.push(property);
                }
                else if (prp.type == 'screen') {
                    const screens = await iobrokerHandler.getAllNames('screen');
                    let property = { name: name, type: "list", values: screens, service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
                else {
                    let property = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
                    properties.push(property);
                }
            }
            return properties;
        }
        else {
            const screens = await iobrokerHandler.getAllNames('screen');
            properties.push({ name: 'screenName', type: "list", values: screens, service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'relativeSignalsPath', type: "string", service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretch', type: "list", values: ['none', 'fill', 'uniform', 'uniformToFill'], service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretchWidth', type: "number", service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretchHeight', type: "number", service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'stretchHeight', type: "number", service: this, propertyType: PropertyType.propertyAndAttribute });
            properties.push({ name: 'useStyleFromScreenForViewer', type: "boolean", service: this, propertyType: PropertyType.propertyAndAttribute });
            return properties;
        }
    }
}
