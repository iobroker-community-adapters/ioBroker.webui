import { BindingMode, PropertiesHelper } from "@node-projects/web-component-designer";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
export class IobrokerWebuiBindingService {
    getBindings(designItem) {
        const iobBindings = Array.from(IobrokerWebuiBindingsHelper.getBindings(designItem.element));
        return iobBindings.map(x => ({
            targetName: x[1].target == 'css' ? PropertiesHelper.camelToDashCase(x[0]) : x[0],
            target: x[1].target,
            mode: x[1].twoWay ? BindingMode.twoWay : BindingMode.oneWay,
            invert: x[1].inverted,
            bindableObjectNames: x[1].signal.split(';'),
            expression: x[1].expression,
            converter: x[1].converter,
            type: x[1].type
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
