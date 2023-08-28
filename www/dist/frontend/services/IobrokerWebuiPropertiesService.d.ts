import { BaseCustomWebComponentPropertiesService, IDesignItem, IProperty } from "@node-projects/web-component-designer";
import { IControl } from "../interfaces/IControl.js";
export declare class IobrokerWebuiPropertiesService extends BaseCustomWebComponentPropertiesService {
    isHandledElement(designItem: IDesignItem): boolean;
    getProperties(designItem: IDesignItem): IProperty[];
    protected parseProperties(control: IControl): IProperty[];
}
