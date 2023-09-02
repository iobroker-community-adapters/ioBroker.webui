import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { IobrokerWebuiScreenEditor } from "../config/IobrokerWebuiScreenEditor.js";
export class IobrokerWebuiConfigButtonProvider {
    constructor() { }
    provideButtons(designerView, designerCanvas) {
        const c = document.createElement('div');
        c.style.display = 'flex';
        c.style.marginLeft = '20px';
        c.style.marginRight = '20px';
        c.style.alignItems = 'center';
        c.style.whiteSpace = 'nowrap';
        const chk = document.createElement('input');
        chk.style.margin = '0';
        chk.style.width = 'auto';
        chk.style.marginRight = '4px';
        chk.type = 'checkbox';
        chk.checked = true;
        c.appendChild(chk);
        c.appendChild(document.createTextNode('enable bindings'));
        const rel = document.createElement('input');
        rel.style.margin = '0';
        rel.style.width = '40px';
        rel.style.height = '13px';
        rel.style.marginLeft = '4px';
        rel.style.fontSize = '11px';
        rel.title = "relative bindings prefix";
        rel.onchange = () => chk.onchange(null);
        c.appendChild(rel);
        chk.onchange = () => {
            const se = DomHelper.findParentNodeOfType(designerCanvas, IobrokerWebuiScreenEditor);
            se.bindingsEnabled = chk.checked;
            se.relativeBindingsPrefix = rel.value;
            if (chk.checked)
                se.applyBindings();
            else
                se.removeBindings();
        };
        return [c];
    }
}
