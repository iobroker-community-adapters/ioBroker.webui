import { IBindableObjectsService, IBindableObject, BindableObjectType, InstanceServiceContainer } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiBindableObjectsService implements IBindableObjectsService {
  name: string = 'iobroker';
  
  hasObjectsForInstanceServiceContainer(instanceServiceContainer: InstanceServiceContainer) {
    return true;
  }

  _states: Record<string, ioBroker.Object>;

  async getBindableObject(fullName: string): Promise<IBindableObject<ioBroker.State>> {
    let objs = await this.getBindableObjects();
    let parts = fullName.split('.');
    let result: IBindableObject<ioBroker.State> = null;
    for (let p of parts) {
      result = objs.find(x => x.name == p);
      objs = <IBindableObject<ioBroker.State>[]>result.children
    }
    return result;
  }

  clearCache() {
    this._states = null;
  }

  async getBindableObjects(parent?: IBindableObject<ioBroker.State>): Promise<IBindableObject<ioBroker.State>[]> {
    if (!this._states) {
      await iobrokerHandler.connection.waitForFirstConnection();
      this._states = await iobrokerHandler.connection.getObjects(true);
    }

    let start = "";
    if (parent)
      start = parent.fullName;
    let set = new Set<string>();
    let retVal: IBindableObject<any>[] = [];
    let folder: IBindableObject<void>
    for (let k of Object.keys(this._states).sort()) {
      if (k.startsWith(start)) {
        const withoutParentName = k.substring(start ? start.length + 1 : 0);
        const splits = withoutParentName.split('.');
        const fldName = splits[0];

        if (splits.length > 1 && !set.has(fldName)) {
          set.add(fldName);
          folder = { bindabletype: 'signal', name: fldName, fullName: parent ? parent.fullName + '.' + fldName : fldName, type: BindableObjectType.folder }
          retVal.push(folder);
        }

        if (splits.length === 1 && splits[0] && (this._states[k].type != 'channel' && this._states[k].type != 'device')) {
          const signal: IBindableObject<ioBroker.Object> = { bindabletype: 'signal', name: splits[0], fullName: k, type: BindableObjectType.undefined, originalObject: this._states[k], children: false };
          retVal.push(signal);
        }
      }
    }
    return retVal;
  }
}