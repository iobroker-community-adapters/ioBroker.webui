import { IProperty, IPropertiesService, IDesignItem } from '@node-projects/web-component-designer';

export class CustomPropertiesService implements IPropertiesService {

    setValue(designItem: IDesignItem, property: IProperty, value: any) {
      // throw new Error("Method not implemented.");
    }
    getValue(designItem: IDesignItem, property: IProperty) {
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