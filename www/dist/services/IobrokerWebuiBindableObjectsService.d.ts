/// <reference types="iobroker" />
/// <reference types="iobroker" />
import { IBindableObjectsService, IBindableObject } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiBindableObjectsService implements IBindableObjectsService {
    name: string;
    _states: Record<string, ioBroker.Object>;
    getBindableObject(fullName: string): Promise<IBindableObject<ioBroker.State>>;
    getBindableObjects(parent?: IBindableObject<ioBroker.State>): Promise<IBindableObject<ioBroker.State>[]>;
}
