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
        converters: ArrayConstructor;
    };
    twoWayPossible: boolean;
    twoWay: boolean;
    expression: string;
    objectNames: string;
    invert: boolean;
    converters: {
        key: string;
        value: any;
    }[];
    _property: IProperty;
    private _binding;
    private _bindingTarget;
    private _activeRow;
    constructor(property: IProperty, binding: IBinding & {
        converter: Record<string, any>;
    }, bindingTarget: BindingTarget);
    ready(): void;
    _focusRow(index: number): void;
    _updatefocusedRow(): void;
    addConverter(): void;
    removeConverter(): void;
}
