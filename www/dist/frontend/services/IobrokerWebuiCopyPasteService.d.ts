import { CopyPasteAsJsonService, IDesignItem, IRect, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiCopyPasteService extends CopyPasteAsJsonService {
    getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]>;
}
