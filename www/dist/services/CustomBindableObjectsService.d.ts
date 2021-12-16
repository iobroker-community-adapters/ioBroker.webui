import { IBindableObjectsService, IBindableObject } from "@node-projects/web-component-designer";
export declare class CustomBindableObjectsService implements IBindableObjectsService {
    getBindableObject(fullName: string): Promise<IBindableObject>;
    getBindableObjects(parent?: IBindableObject): Promise<IBindableObject[]>;
}
