import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class ComboBox extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    static readonly is = "iobroker-webui-svg-image";
    private _select;
    constructor();
    private _items;
    get items(): string;
    set items(value: string);
}
