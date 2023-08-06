import type { BindingTarget } from "@node-projects/web-component-designer";
export interface IIobrokerWebuiBinding {
    signal: string;
    inverted?: boolean;
    twoWay?: boolean;
    events?: string[];
    target: BindingTarget;
    converter?: IBindingConverter;
}
export interface IBindingConverter {
    [condition: string]: any;
}
