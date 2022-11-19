import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class SvgImage extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly is = "iobroker-webui-svg-image";
    constructor();
    private _src;
    get src(): string;
    set src(value: string);
}
