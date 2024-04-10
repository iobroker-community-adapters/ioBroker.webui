import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
export class IobrokerWebuiDemoProviderService {
    async provideDemo(container, serviceContainer, instanceServiceContainer, code) {
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
        screenViewer.loadScreenData(code, designer.documentContainer.additionalData.model.getValue(), designer.scriptModel.getValue(), null);
        screenViewer.style.display = '';
        screenViewer.shadowRoot.querySelectorAll('a').forEach(x => x.onclick = () => false); // disable links in preview view...
    }
}
