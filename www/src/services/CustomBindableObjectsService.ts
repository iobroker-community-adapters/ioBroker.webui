import { IBindableObjectsService, IBindableObject, BindableObjectType } from "@node-projects/web-component-designer";

export class CustomBindableObjectsService implements IBindableObjectsService {

  async getBindableObject(fullName: string): Promise<IBindableObject> {
    let objs = await this.getBindableObjects();
    let parts = fullName.split('.');
    let result: IBindableObject = null;
    for (let p of parts) {
      result = objs.find(x => x.name == p);
      objs = <IBindableObject[]>result.children
    }
    return result;
  }

  async getBindableObjects(parent?: IBindableObject): Promise<IBindableObject[]> {
    return [
      {
        name: 'DemoData', fullName: 'DemoData', type: BindableObjectType.folder, children: [
          { name: 'value1', fullName: 'DemoData.value1', type: BindableObjectType.number },
          { name: 'value2', fullName: 'DemoData.value2', type: BindableObjectType.string }
        ]
      }
    ]
  }
}