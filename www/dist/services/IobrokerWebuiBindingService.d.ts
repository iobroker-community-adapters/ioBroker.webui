import { IBindingService, IDesignItem } from "@node-projects/web-component-designer";
import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget";
import { IBinding } from "@node-projects/web-component-designer/dist/elements/item/IBinding";
export declare class IobrokerWebuiBindingService implements IBindingService {
    getBindings(designItem: IDesignItem): IBinding[];
    setBinding(designItem: IDesignItem, binding: IBinding): boolean;
    clearBinding(designItem: IDesignItem, propertyName: string, propertyTarget: BindingTarget): boolean;
}
