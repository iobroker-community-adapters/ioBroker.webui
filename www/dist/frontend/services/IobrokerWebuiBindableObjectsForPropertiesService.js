export class IobrokerWebuiBindableObjectsForPropertiesService {
    name = 'properties';
    hasObjectsForInstanceServiceContainer(instanceServiceContainer) {
        return true;
    }
    async getBindableObject(fullName, instanceServiceContainer) {
        return null;
    }
    clearCache() {
    }
    async getBindableObjects(parent, instanceServiceContainer) {
        const sc = instanceServiceContainer.designer;
        let b = [];
        for (let p in sc.properties) {
            let prp = sc.properties[p];
            let tp = prp.type;
            let specialType = null;
            if (tp == 'signal') {
                tp = 'string';
                specialType = 'signalProperty';
            }
            else if (tp == 'screen') {
                tp = 'string';
                specialType = 'screenProperty';
            }
            b.push({ bindabletype: 'property', name: p, type: tp, specialType, fullName: p, children: false, originalObject: prp });
        }
        return b;
    }
}
