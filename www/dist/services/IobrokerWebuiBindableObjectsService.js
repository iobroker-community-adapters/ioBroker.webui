import { BindableObjectType } from '/webui/node_modules/@node-projects/web-component-designer/./dist/index.js';
import { iobrokerHandler } from '../IobrokerHandler.js';
export class IobrokerWebuiBindableObjectsService {
    constructor() {
        this.name = 'iobroker';
    }
    async getBindableObject(fullName) {
        let objs = await this.getBindableObjects();
        let parts = fullName.split('.');
        let result = null;
        for (let p of parts) {
            result = objs.find(x => x.name == p);
            objs = result.children;
        }
        return result;
    }
    async getBindableObjects(parent) {
        if (!this._states) {
            await iobrokerHandler.connection.waitForFirstConnection();
            this._states = await iobrokerHandler.connection.getStates();
        }
        let start = "";
        if (parent)
            start = parent.fullName;
        let set = new Set();
        let retVal = [];
        let folder;
        for (let k of Object.keys(this._states).sort()) {
            if (k.startsWith(start)) {
                const withoutParentName = k.substring(start ? start.length + 1 : 0);
                const splits = withoutParentName.split('.');
                const fldName = splits[0];
                if (splits.length > 1 && !set.has(fldName)) {
                    set.add(fldName);
                    folder = { name: fldName, fullName: parent ? parent.fullName + '.' + fldName : fldName, type: BindableObjectType.folder };
                    retVal.push(folder);
                }
                if (splits.length === 1) {
                    const signal = { name: splits[0], fullName: k, type: BindableObjectType.undefined, originalObject: this._states[k], children: false };
                    retVal.push(signal);
                }
            }
        }
        return retVal;
    }
}
