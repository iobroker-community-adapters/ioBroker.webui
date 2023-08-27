//Binding: haow to use...
//binding:display="{'signal':'aa',..."
//binding:value="aa" -> simplified form when only binding a direct property

import type { BindingTarget } from "@node-projects/web-component-designer";

export interface IIobrokerWebuiBinding {
    signal: string;
    inverted?: boolean;
    twoWay?: boolean;
    events?: string[];
    target: BindingTarget;
    converter?: Record<string, any>;
    expression?: string;
}