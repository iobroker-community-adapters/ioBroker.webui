import { IBindingService, IDesignItem } from "@node-projects/web-component-designer";
import { BindingMode } from "@node-projects/web-component-designer/dist/elements/item/BindingMode";
import { IBinding } from "@node-projects/web-component-designer/dist/elements/item/IBinding";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper";

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
}