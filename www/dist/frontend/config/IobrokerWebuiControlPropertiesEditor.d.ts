import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiControlPropertiesEditor extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    static template: HTMLTemplateElement;
    constructor();
    ready(): void;
    properties: {
        name: string;
        type: string;
        values?: string;
    }[];
    propertiesObj: Record<string, string>;
    setProperties(properties: Record<string, string>): void;
    refresh(): void;
    addProp(): void;
    addEnumProp(): void;
    removeProp(index: number): void;
    changed(): void;
}
