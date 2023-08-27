import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiControlPropertiesEditor extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    static template: HTMLTemplateElement;
    constructor();
    ready(): void;
    properties: {
        name: string;
        type: string;
    }[];
    propertiesObj: Record<string, string>;
    setProperties(properties: Record<string, string>): void;
    refresh(): void;
    add(): void;
    changed(): void;
}
