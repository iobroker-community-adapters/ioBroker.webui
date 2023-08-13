import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class SvgImage extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    static readonly is = "iobroker-webui-svg-image";
    private _head;
    private _main;
    private _foot;
    constructor();
    ready(): void;
    private _src;
    get src(): string;
    set src(value: string);
    private _bgImageSrc;
    get bgImageSrc(): string;
    set bgImageSrc(value: string);
    private _value;
    get value(): string;
    set value(value: string);
    private _name;
    get name(): string;
    set name(value: string);
}
