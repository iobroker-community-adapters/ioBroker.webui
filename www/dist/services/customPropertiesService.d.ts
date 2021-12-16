import { IProperty, IPropertiesService, IDesignItem } from '@node-projects/web-component-designer';
import { ValueType } from '@node-projects/web-component-designer/dist/elements/services/propertiesService/ValueType';
export declare class CustomPropertiesService implements IPropertiesService {
    clearValue(designItems: IDesignItem[], property: IProperty): void;
    isSet(designItems: IDesignItem[], property: IProperty): ValueType;
    getUnsetValue(designItems: IDesignItem[], property: IProperty): void;
    setValue(designItems: IDesignItem[], property: IProperty, value: any): void;
    getValue(designItems: IDesignItem[], property: IProperty): void;
    name: string;
    isHandledElement(designItem: IDesignItem): boolean;
    getProperty(designItem: IDesignItem, name: string): IProperty;
    getProperties(designItem: IDesignItem): IProperty[];
}
