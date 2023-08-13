import { IDemoProviderService, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiDemoProviderService implements IDemoProviderService {
    provideDemo(container: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string): Promise<void>;
}
