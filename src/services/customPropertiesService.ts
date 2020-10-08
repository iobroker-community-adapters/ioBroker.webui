import { IProperty, IPropertiesService, IDesignItem } from '@node-projects/web-component-designer';
import { ValueType } from '@node-projects/web-component-designer/dist/elements/services/propertiesService/ValueType';

export class CustomPropertiesService implements IPropertiesService {
    clearValue(designItems: IDesignItem[], property: IProperty) {
      // throw new Error('Method not implemented.');
    }
    isSet(designItems: IDesignItem[], property: IProperty): ValueType {
      throw new Error("Method not implemented.");
    }
    getUnsetValue(designItems: IDesignItem[], property: IProperty) {
      throw new Error("Method not implemented.");
    }

    setValue(designItems: IDesignItem[], property: IProperty, value: any) {
      // throw new Error("Method not implemented.");
    }
    getValue(designItems: IDesignItem[], property: IProperty) {
      // throw new Error("Method not implemented.");
    }

    name: string = "custom";

    isHandledElement(designItem: IDesignItem): boolean {
        if (designItem.element.nodeName == "test-element")
            return true;
        return false;
    }

    getProperties(designItem: IDesignItem): IProperty[] {
        let properties: IProperty[] = [];
        properties.push({ name: "Test 1", type: "string", service: this });            
        return properties;
    }
}