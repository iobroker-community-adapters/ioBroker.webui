import { BaseCustomWebComponentLazyAppend } from "@node-projects/base-custom-webcomponent";
import { IControl } from "../interfaces/IControl";
export declare class BaseCustomControl extends BaseCustomWebComponentLazyAppend {
    static readonly style: CSSStyleSheet;
    constructor();
}
export declare function generateCustomControl(name: string, control: IControl): void;
