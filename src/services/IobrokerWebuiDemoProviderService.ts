import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { IDemoProviderService, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
import { ScreenViewer } from "../runtime/ScreenViewer.js";

export class IobrokerWebuiDemoProviderService implements IDemoProviderService {
  provideDemo(container: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string) {
    return new Promise<void>(resolve => {
      const screenViewer = new ScreenViewer();
      screenViewer.style.width = '100%';
      screenViewer.style.height = '100%';
      screenViewer.style.border = 'none';
      screenViewer.style.display = 'none';
      screenViewer.style.overflow = 'auto';
      screenViewer.style.position = 'absolute';

      DomHelper.removeAllChildnodes(container);
      container.appendChild(screenViewer);

      screenViewer.loadScreenData(code);
      screenViewer.style.display = 'block';
      
      resolve();
    });
  }
}