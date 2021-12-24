import { DomHelper } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { ScreenViewer } from '../runtime/ScreenViewer.js';
export class IobrokerWebuiDemoProviderService {
    provideDemo(container, serviceContainer, instanceServiceContainer, code) {
        return new Promise(resolve => {
            const screenViewer = new ScreenViewer();
            screenViewer.style.width = '100%';
            screenViewer.style.height = '100%';
            screenViewer.style.border = 'none';
            screenViewer.style.display = 'none';
            screenViewer.style.position = 'absolute';
            DomHelper.removeAllChildnodes(container);
            container.appendChild(screenViewer);
            screenViewer.loadScreenData(code);
            screenViewer.style.display = 'block';
            resolve();
        });
    }
}
