import { IIobrokerWebuiBinding } from "../interfaces/IIobrokerWebuiBinding";
export declare type namedBinding = [name: string, binding: IIobrokerWebuiBinding];
export declare class IobrokerWebuiBindingsHelper {
    static parseBinding(element: Element, name: string, value: string): namedBinding;
    static serializeBinding(element: Element, name: string, binding: IIobrokerWebuiBinding): string;
    static getBindings(element: Element): Generator<namedBinding, void, unknown>;
    static applyAllBindings(rootElement: ParentNode): (() => void)[];
    static applyBinding(element: Element, binding: namedBinding): () => void;
    static handleValueChanged(element: Element, binding: namedBinding, value: any): void;
}
