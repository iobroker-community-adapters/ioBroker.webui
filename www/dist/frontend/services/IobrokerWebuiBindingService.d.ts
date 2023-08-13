import { BindingTarget, IBinding, IBindingService, IDesignItem } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiBindingService implements IBindingService {
    getBindings(designItem: IDesignItem): IBinding[];
    setBinding(designItem: IDesignItem, binding: IBinding): boolean;
    clearBinding(designItem: IDesignItem, propertyName: string, propertyTarget: BindingTarget): boolean;
}
