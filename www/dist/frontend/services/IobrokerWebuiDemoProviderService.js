import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
export class IobrokerWebuiDemoProviderService {
    provideDemo(container, serviceContainer, instanceServiceContainer, code) {
        return new Promise(resolve => {
            const screenViewer = new ScreenViewer();
            screenViewer.style.width = '100%';
            screenViewer.style.height = '100%';
            screenViewer.style.border = 'none';
            screenViewer.style.display = 'none';
            screenViewer.style.overflow = 'auto';
            screenViewer.style.position = 'absolute';
            container.style.position = 'relative';
            let existingSV = container.querySelector(screenViewer.localName);
            existingSV?.removeBindings();
            DomHelper.removeAllChildnodes(container);
            container.appendChild(screenViewer);
            let designer = instanceServiceContainer.designer;
            screenViewer.loadScreenData(code, designer.documentContainer.additionalData.model.getValue());
            screenViewer.style.display = '';
            resolve();
        });
    }
}
