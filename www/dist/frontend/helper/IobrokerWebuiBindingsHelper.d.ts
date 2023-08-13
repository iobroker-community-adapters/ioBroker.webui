import { IIobrokerWebuiBinding } from "../interfaces/IIobrokerWebuiBinding.js";
import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget.js";
export declare const bindingPrefixProperty = "bind-prop:";
export declare const bindingPrefixAttribute = "bind-attr:";
export declare const bindingPrefixCss = "bind-css:";
export type namedBinding = [name: string, binding: IIobrokerWebuiBinding];
export declare class IobrokerWebuiBindingsHelper {
    static parseBinding(element: Element, name: string, value: string, bindingTarget: BindingTarget, prefix: string): namedBinding;
    static serializeBinding(element: Element, name: string, binding: IIobrokerWebuiBinding): [name: string, value: string];
    static getBindingAttributeName(element: Element, propertyName: string, propertyTarget: BindingTarget): string;
    static getBindings(element: Element): Generator<namedBinding, void, unknown>;
    static applyAllBindings(rootElement: ParentNode): (() => void)[];
    static applyBinding(element: Element, binding: namedBinding): () => void;
    static handleValueChanged(element: Element, binding: namedBinding, value: any): void;
}
