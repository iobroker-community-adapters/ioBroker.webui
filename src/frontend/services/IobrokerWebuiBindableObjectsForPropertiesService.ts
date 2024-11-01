import { IBindableObjectsService, IBindableObject, InstanceServiceContainer, BindableObjectType } from "@node-projects/web-component-designer";
import { IobrokerWebuiScreenEditor } from "../config/IobrokerWebuiScreenEditor";

export class IobrokerWebuiBindableObjectsForPropertiesService implements IBindableObjectsService {
  name: string = 'properties';

  hasObjectsForInstanceServiceContainer(instanceServiceContainer: InstanceServiceContainer) {
    return true;
  }

  async getBindableObject(fullName: string, instanceServiceContainer?: InstanceServiceContainer): Promise<IBindableObject<ioBroker.State>> {
    return null;
  }

  clearCache() {

  }

  async getBindableObjects(parent?: IBindableObject<any>, instanceServiceContainer?: InstanceServiceContainer): Promise<IBindableObject<ioBroker.State>[]> {
    const sc = <IobrokerWebuiScreenEditor>instanceServiceContainer.designer;

    let b: IBindableObject<any>[] = [];
    for (let p in sc.properties) {
      let prp = sc.properties[p];
      let tp = prp.type;
      let specialType = null;
      if (tp == 'signal') {
        tp = 'string';
        specialType = 'signalProperty';
      } else  if (tp == 'screen') {
        tp = 'string';
        specialType = 'screenProperty';
      }
      b.push({ bindabletype: 'property', name: p, type: <BindableObjectType>tp, specialType, fullName: p, children: false, originalObject: prp });
    }

    return b;
  }
}