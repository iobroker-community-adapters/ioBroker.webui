import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import { BindingTarget, IBinding, IProperty } from '@node-projects/web-component-designer';
export declare class IobrokerWebuiDynamicsEditor extends BaseCustomWebComponentConstructorAppend {
    static readonly template: HTMLTemplateElement;
    static readonly style: CSSStyleSheet;
    static readonly is = "iobroker-webui-dynamics-editor";
    static readonly properties: {
        twoWayPossible: BooleanConstructor;
        twoWay: BooleanConstructor;
        expression: StringConstructor;
        objectNames: StringConstructor;
        invert: BooleanConstructor;
    };
    twoWayPossible: boolean;
    twoWay: boolean;
    expression: string;
    objectNames: string;
    invert: boolean;
    private _binding;
    private _bindingTarget;
    constructor(property: IProperty, binding: IBinding, bindingTarget: BindingTarget);
    ready(): void;
}
