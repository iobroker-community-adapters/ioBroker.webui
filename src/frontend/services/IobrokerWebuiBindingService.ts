import { BindingMode, BindingTarget, IBinding, IBindingService, IDesignItem } from "@node-projects/web-component-designer";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";

export class IobrokerWebuiBindingService implements IBindingService {
  getBindings(designItem: IDesignItem): IBinding[] {
    const iobBindings = Array.from(IobrokerWebuiBindingsHelper.getBindings(designItem.element));
    return iobBindings.map(x => ({
      targetName: x[0],
      target: x[1].target,
      mode: x[1].twoWay ? BindingMode.twoWay : BindingMode.oneWay,
      invert: x[1].inverted
    }))
  }

  setBinding(designItem: IDesignItem, binding: IBinding): boolean {
    return true;
  }

  clearBinding(designItem: IDesignItem, propertyName: string, propertyTarget: BindingTarget): boolean {
    const name = IobrokerWebuiBindingsHelper.getBindingAttributeName(designItem.element, propertyName, propertyTarget);
    designItem.removeAttribute(name);
    return true;
  }
}