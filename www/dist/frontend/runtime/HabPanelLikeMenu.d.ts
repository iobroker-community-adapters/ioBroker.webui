import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class HabPanelLikeMenu extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    static template: HTMLTemplateElement;
    screens: string[];
    _expanded: boolean;
    get expanded(): boolean;
    set expanded(value: boolean);
    constructor();
    ready(): void;
    switchMenu(): void;
}
