import { BaseCustomWebComponentLazyAppend } from "@node-projects/base-custom-webcomponent";
import { IControl } from "../interfaces/IControl.js";
export declare class BaseCustomControl extends BaseCustomWebComponentLazyAppend {
    static readonly style: CSSStyleSheet;
    constructor();
    ready(): void;
    connectedCallback(): void;
    _getRelativeSignalsPath(): string;
}
export declare function generateCustomControl(name: string, control: IControl): void;
