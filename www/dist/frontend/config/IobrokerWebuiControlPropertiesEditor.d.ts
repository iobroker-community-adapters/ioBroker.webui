import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiControlPropertiesEditor extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    static template: HTMLTemplateElement;
    constructor();
    ready(): void;
    properties: {
        name: string;
        type: string;
        def?: string;
        values?: string;
    }[];
    propertiesObj: Record<string, {
        type: string;
        values?: string[];
        default?: any;
    }>;
    setProperties(properties: Record<string, {
        type: string;
        values?: string[];
        default?: any;
    }>): void;
    refresh(): void;
    addProp(): void;
    addEnumProp(): void;
    removeProp(index: number): void;
    changed(): void;
}
