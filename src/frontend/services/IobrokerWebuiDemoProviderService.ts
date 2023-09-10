import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { IDemoProviderService, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { IobrokerWebuiScreenEditor } from "../config/IobrokerWebuiScreenEditor.js";
import { IobrokerWebuiMonacoEditor } from "../config/IobrokerWebuiMonacoEditor.js";

export class IobrokerWebuiDemoProviderService implements IDemoProviderService {
  async provideDemo(container: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string) {
    const screenViewer = new ScreenViewer();
    screenViewer.style.width = '100%';
    screenViewer.style.height = '100%';
    screenViewer.style.border = 'none';
    screenViewer.style.display = 'none';
    screenViewer.style.overflow = 'auto';
    screenViewer.style.position = 'absolute';

    container.style.position = 'relative';

    let existingSV = <ScreenViewer>container.querySelector(screenViewer.localName);
    existingSV?.removeBindings();

    DomHelper.removeAllChildnodes(container);
    container.appendChild(screenViewer);

    let designer: IobrokerWebuiScreenEditor = instanceServiceContainer.designer;
    screenViewer.loadScreenData(code, designer.documentContainer.additionalData.model.getValue(), await IobrokerWebuiMonacoEditor.getCompiledJavascriptCode(designer.scriptModel));
    screenViewer.style.display = '';
    screenViewer.shadowRoot.querySelectorAll('a').forEach(x => x.onclick = () => false); // disable links in preview view...
  }
}