import { BindingMode } from '/webui/node_modules/@node-projects/web-component-designer/dist/elements/item/BindingMode.js';
import { IobrokerWebuiBindingsHelper } from '../helper/IobrokerWebuiBindingsHelper.js';
export class IobrokerWebuiBindingService {
    getBindings(designItem) {
        const iobBindings = Array.from(IobrokerWebuiBindingsHelper.getBindings(designItem.element));
        return iobBindings.map(x => ({
            targetName: x[0],
            target: x[1].target,
            mode: x[1].twoWay ? BindingMode.twoWay : BindingMode.oneWay,
            invert: x[1].inverted
        }));
    }
    setBinding(designItem, binding) {
        return true;
    }
    clearBinding(designItem, propertyName, propertyTarget) {
        const name = IobrokerWebuiBindingsHelper.getBindingAttributeName(designItem.element, propertyName, propertyTarget);
        designItem.removeAttribute(name);
        return true;
    }
}
