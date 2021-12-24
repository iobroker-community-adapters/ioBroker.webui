import { IBindingService, IDesignItem } from "@node-projects/web-component-designer";
import { IBinding } from "@node-projects/web-component-designer/dist/elements/item/IBinding";
export declare class IobrokerWebuiBindingService implements IBindingService {
    getBindings(designItem: IDesignItem): IBinding[];
    setBinding(designItem: IDesignItem, binding: IBinding): boolean;
}
