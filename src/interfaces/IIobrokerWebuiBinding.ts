//Binding: haow to use...
//binding:display="{'signal':'aa',..."
//binding:value="aa" -> simplified form when only binding a direct property

import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget";

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