import { BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import { BindingTarget, IBinding, IProperty } from '@node-projects/web-component-designer';
export declare class IobrokerWebuiDynamicsEditor extends BaseCustomWebComponentConstructorAppend {
    static readonly template: HTMLTemplateElement;
    static readonly style: CSSStyleSheet;
    static readonly is = "iobroker-webui-dynamics-editor";
    static readonly properties: {
        twoWayPossible: BooleanConstructor;
        twoWay: BooleanConstructor;
        complex: BooleanConstructor;
        formula: StringConstructor;
        objectNames: StringConstructor;
        invert: BooleanConstructor;
        expression: StringConstructor;
    };
    twoWayPossible: boolean;
    twoWay: boolean;
    complex: boolean;
    formula: string;
    objectNames: string;
    invert: boolean;
    expression: string;
    private _binding;
    private _bindingTarget;
    constructor(property: IProperty, binding: IBinding, bindingTarget: BindingTarget);
    ready(): void;
}
