import { AbstractExtension } from './AbstractExtension.js';
import { OverlayLayer } from "./OverlayLayer.js";
export class InvisibleElementExtension extends AbstractExtension {
    _rect;
    constructor(extensionManager, designerCanvas, extendedItem) {
        super(extensionManager, designerCanvas, extendedItem);
    }
    extend(cache, event) {
        this.refresh(cache, event);
    }
    refresh(cache, event) {
        const t = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
        if (this._valuesHaveChanges(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y, t.p4.x, t.p4.y)) {
            this._rect = this._drawTransformedRect(t, 'svg-invisible-div', this._rect, OverlayLayer.Background);
        }
    }
    dispose() {
        this._removeAllOverlays();
    }
}
//# sourceMappingURL=InvisibleElementExtension.js.map