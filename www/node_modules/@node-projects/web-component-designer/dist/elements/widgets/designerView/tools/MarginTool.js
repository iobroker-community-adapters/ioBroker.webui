import { EventNames } from '../../../../enums/EventNames.js';
import { NamedTools } from './NamedTools.js';
export class MarginTool {
    cursor = 'pointer';
    _changeGroup;
    pointerEventHandler(designerCanvas, event, currentElement) {
        designerCanvas.serviceContainer.designerTools.get(NamedTools.Pointer).pointerEventHandler(designerCanvas, event, currentElement);
    }
    keyboardEventHandler(designerCanvas, event, currentElement) {
        event.preventDefault();
        const sel = designerCanvas.instanceServiceContainer.selectionService.primarySelection;
        const cs = getComputedStyle(sel.element);
        let nm = "";
        switch (event.key) {
            case "ArrowLeft":
                nm = "margin-left";
                break;
            case "ArrowRight":
                nm = "margin-right";
                break;
            case "ArrowUp":
                nm = "margin-top";
                break;
            case "ArrowDown":
                nm = "margin-bottom";
                break;
        }
        if (nm) {
            if (event.type == EventNames.KeyDown && !this._changeGroup)
                this._changeGroup = sel.openGroup("change margin");
            if (this._changeGroup) {
                sel.setStyleAsync(nm, (parseFloat(cs[nm]) + (event.altKey ? -1 : 1)) + "px");
                if (event.type == EventNames.KeyUp) {
                    this._changeGroup.commit();
                    this._changeGroup = null;
                }
            }
        }
    }
    activated(serviceContainer) {
    }
    dispose() {
        if (this._changeGroup) {
            this._changeGroup.abort();
            this._changeGroup = null;
        }
    }
}
//# sourceMappingURL=MarginTool.js.map