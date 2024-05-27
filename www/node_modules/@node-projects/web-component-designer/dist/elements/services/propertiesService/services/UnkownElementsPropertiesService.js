import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
export class UnkownElementsPropertiesService extends AbstractPropertiesService {
    getRefreshMode(designItem) {
        return RefreshMode.full;
    }
    isHandledElement(designItem) {
        return true;
    }
    async getProperties(designItem) {
        let list = Object.getOwnPropertyNames(Object.getPrototypeOf(designItem.element));
        let props = [];
        for (let p of list) {
            if (p.startsWith('on'))
                continue;
            let desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(designItem.element), p);
            if (desc.get || desc.set) {
                let v = designItem.element[p];
                if (typeof v == 'boolean')
                    props.push({ name: p, type: 'boolean', service: this, propertyType: PropertyType.propertyAndAttribute });
                else if (typeof v == 'number')
                    props.push({ name: p, type: 'bonumberolean', service: this, propertyType: PropertyType.propertyAndAttribute });
                else
                    props.push({ name: p, type: 'string', service: this, propertyType: PropertyType.propertyAndAttribute });
            }
        }
        return props;
    }
}
//# sourceMappingURL=UnkownElementsPropertiesService.js.map