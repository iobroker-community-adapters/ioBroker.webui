import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class HabPanelLikeMenu extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    static template: HTMLTemplateElement;
    screens: string[];
    expanded: boolean;
    constructor();
    ready(): void;
    switchMenu(): void;
}
