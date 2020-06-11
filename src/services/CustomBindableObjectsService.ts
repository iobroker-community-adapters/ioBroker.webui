import { IBindableObjectsService, IBindableObject, BindableObjectType } from "@node-projects/web-component-designer";

export class CustomBindableObjectsService implements IBindableObjectsService {

    getBindableObject(name: string): IBindableObject {
        let objs = this.getBindableObjects();
        let parts = name.split('.');
        let result: IBindableObject = null;
        for (let p of parts) {
            result = objs.find(x => x.name == p);
            objs = result.children
        }
        return result;
    }

    getBindableObjects(parent?: IBindableObject, recursive?: boolean): IBindableObject[] {
        return [
            {
                name: 'DemoData', type: BindableObjectType.folder, children: [
                    { name: 'value1', type: BindableObjectType.number },
                    { name: 'value2', type: BindableObjectType.string }
                ]
            }
        ]
    }
}