import { IBindableObjectsService, IBindableObject, BindableObjectType, InstanceServiceContainer } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiBindableLocalObjectsService implements IBindableObjectsService {
  name: string = 'locals';

  hasObjectsForInstanceServiceContainer(instanceServiceContainer: InstanceServiceContainer) {
    return true;
  }

  async getBindableObject(fullName: string): Promise<IBindableObject<void>> {
    let objs = (await this.getBindableObjects()).sort();
    let parts = fullName.split('.');
    let result: IBindableObject<void> = null;
    for (let p of parts) {
      result = objs.find(x => x.name == p);
      objs = <IBindableObject<void>[]>result.children
    }
    return result;
  }

  clearCache() {
  }

  async getBindableObjects(parent?: IBindableObject<void>): Promise<IBindableObject<void>[]> {
    let names = iobrokerHandler.getLocalStateNames();
    let start = "";
    if (parent)
      start = parent.fullName;
    let set = new Set<string>();
    let retVal: IBindableObject<any>[] = [];
    let folder: IBindableObject<void>
    for (let k of names) {
      if (k.startsWith(start)) {
        const withoutParentName = k.substring(start ? start.length + 1 : 0);
        const splits = withoutParentName.split('.');
        const fldName = splits[0];

        if (splits.length > 1 && !set.has(fldName)) {
          set.add(fldName);
          folder = { bindabletype: 'signal', name: fldName, fullName: parent ? parent.fullName + '.' + fldName : fldName, type: BindableObjectType.folder }
          retVal.push(folder);
        }

        if (splits.length === 1 && splits[0]) {
          const signal: IBindableObject<ioBroker.Object> = { bindabletype: 'signal', name: splits[0], fullName: k, type: BindableObjectType.undefined, originalObject: null, children: false };
          retVal.push(signal);
        }
      }
    }
    return retVal;
  }
}