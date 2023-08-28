import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { IControl } from "../interfaces/IControl.js";
export declare class BaseCustomControl extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    constructor();
    connectedCallback(): void;
    _getRelativeSignalsPath(): string;
}
export declare function generateCustomControl(name: string, control: IControl): void;
