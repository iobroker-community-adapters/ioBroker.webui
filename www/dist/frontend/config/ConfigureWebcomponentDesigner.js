import { BaseCustomWebcomponentBindingsService, CodeViewMonaco, CssToolsStylesheetService, JsonFileElementsService, NodeHtmlParserService, PreDefinedElementsService, createDefaultServiceContainer } from "@node-projects/web-component-designer";
import { IobrokerWebuiBindableObjectsService } from "../services/IobrokerWebuiBindableObjectsService.js";
import { IobrokerWebuiBindableObjectDragDropService } from "../services/IobrokerWebuiBindableObjectDragDropService.js";
import { IobrokerWebuiBindingService } from "../services/IobrokerWebuiBindingService.js";
import { IobrokerWebuiDemoProviderService } from "../services/IobrokerWebuiDemoProviderService.js";
import { IobrokerWebuiDynamicsEditor } from "./IobrokerWebuiDynamicsEditor.js";
import { IobrokerWebuiConfirmationWrapper } from "./IobrokerWebuiConfirmationWrapper.js";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import customElementsObserver from "../widgets/customElementsObserver.js";
import { IobrokerWebuiExternalDragDropService } from "../services/IobrokerWebuiExternalDragDropService.js";
import { IobrokerWebuiCopyPasteService } from "../services/IobrokerWebuiCopyPasteService.js";
import { IobrokerWebuiEventsService } from "../services/IobrokerWebuiEventsService.js";
import { IobrokerWebuiPropertyGridDragDropService } from "../services/IobrokerWebuiPropertyGridDragDropService.js";
const rootPath = new URL(import.meta.url).pathname.split('/').slice(0, -4).join('/'); // -2 remove file & dist
const serviceContainer = createDefaultServiceContainer();
serviceContainer.register("bindingService", new BaseCustomWebcomponentBindingsService());
serviceContainer.register("htmlParserService", new NodeHtmlParserService(rootPath + '/node_modules/@node-projects/node-html-parser-esm/dist/index.js'));
serviceContainer.register("bindableObjectsService", new IobrokerWebuiBindableObjectsService());
serviceContainer.register("bindableObjectDragDropService", new IobrokerWebuiBindableObjectDragDropService());
serviceContainer.register("bindingService", new IobrokerWebuiBindingService());
serviceContainer.register("demoProviderService", new IobrokerWebuiDemoProviderService());
serviceContainer.register("externalDragDropService", new IobrokerWebuiExternalDragDropService());
serviceContainer.register("copyPasteService", new IobrokerWebuiCopyPasteService());
serviceContainer.register("eventsService", new IobrokerWebuiEventsService());
serviceContainer.register("propertyGridDragDropService", new IobrokerWebuiPropertyGridDragDropService());
serviceContainer.register("stylesheetService", designerCanvas => new CssToolsStylesheetService(designerCanvas));
serviceContainer.config.codeViewWidget = CodeViewMonaco;
serviceContainer.register('elementsService', new JsonFileElementsService('webui', './dist/frontend/elements-webui.json'));
serviceContainer.register('elementsService', new JsonFileElementsService('native', './node_modules/@node-projects/web-component-designer/config/elements-native.json'));
for (let l of customElementsObserver.getElements()) {
    if (l[1].length > 0) {
        const elementsCfg = {
            elements: l[1]
        };
        let elService = new PreDefinedElementsService(l[0], elementsCfg);
        serviceContainer.register('elementsService', elService);
    }
}
serviceContainer.config.openBindingsEditor = async (property, designItems, binding, target) => {
    let dynEdt = new IobrokerWebuiDynamicsEditor(property, binding, target);
    let cw = new IobrokerWebuiConfirmationWrapper();
    cw.title = "Edit Binding of '" + property.name + "' - " + property.propertyType;
    cw.appendChild(dynEdt);
    let dlg = window.appShell.openDialog(cw, 200, 200, 700, 460);
    cw.cancelClicked.on((e) => {
        dlg.close();
    });
    cw.okClicked.on((e) => {
        dlg.close();
        let bnd = { signal: dynEdt.objectNames, target };
        bnd.inverted = dynEdt.invert;
        bnd.twoWay = dynEdt.twoWay;
        bnd.expression = dynEdt.expression;
        if (dynEdt.converters.length > 0) {
            let cObj = {};
            for (let c of dynEdt.converters) {
                cObj[c.key] = c.value;
            }
            bnd.converter = cObj;
        }
        let serializedBnd = IobrokerWebuiBindingsHelper.serializeBinding(designItems[0].element, property.name, bnd);
        let group = designItems[0].openGroup('edit_binding');
        designItems[0].setAttribute(serializedBnd[0], serializedBnd[1]);
        group.commit();
    });
};
//LazyLoader.LoadJavascript(window.iobrokerWebRootUrl + 'webui.0.widgets/importmap.js');
import(window.iobrokerWebRootUrl + 'webui.0.widgets/configWidgets.js').then(x => {
    x.registerNpmWidgets(serviceContainer);
    //paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);
}).catch(err => {
    console.error('error loading widgets designer generated code', err);
});
import(window.iobrokerWebRootUrl + 'webui.0.widgets/designerAddons.js').then(x => {
    x.registerDesignerAddons(serviceContainer);
}).catch(err => {
    console.error('error loading widgets designer addons', err);
});
serviceContainer.globalContext.onToolChanged.on((e) => {
    let name = [...serviceContainer.designerTools.entries()].filter(({ 1: v }) => v === e.newValue.tool).map(([k]) => k)[0];
    if (e.newValue == null)
        name = "Pointer";
    const buttons = Array.from(document.getElementById('tools').querySelectorAll('[data-command]'));
    for (const b of buttons) {
        if (b.dataset.commandParameter == name)
            b.style.backgroundColor = "green";
        else
            b.style.backgroundColor = "";
    }
});
export default serviceContainer;
