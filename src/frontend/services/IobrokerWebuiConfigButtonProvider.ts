import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { DesignerView, IDesignViewConfigButtonsProvider, IDesignerCanvas } from "@node-projects/web-component-designer";
import { IobrokerWebuiScreenEditor } from "../config/IobrokerWebuiScreenEditor.js";

export class IobrokerWebuiConfigButtonProvider implements IDesignViewConfigButtonsProvider {

    constructor() { }

    provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
        const c = document.createElement('div');
        c.style.display = 'flex';
        c.style.marginLeft = '20px';
        c.style.marginRight = '20px';
        const chk = document.createElement('input');
        chk.style.margin = '0';
        chk.style.width = 'auto';
        chk.style.marginRight = '4px';
        chk.type = 'checkbox';
        chk.checked = true;
        c.appendChild(chk);
        c.appendChild(document.createTextNode('enable bindings'));

        chk.onchange = () => {
            const se = DomHelper.findParentNodeOfType(designerCanvas, IobrokerWebuiScreenEditor);
            se.bindingsEnabled = chk.checked;
            if (chk.checked)
                se.applyBindings();
            else
                se.removeBindings();
        }

        return [c];
    }
}