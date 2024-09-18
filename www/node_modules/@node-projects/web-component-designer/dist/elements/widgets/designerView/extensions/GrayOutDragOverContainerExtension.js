import { AbstractExtension } from './AbstractExtension.js';
import { OverlayLayer } from "./OverlayLayer.js";
export class GrayOutDragOverContainerExtension extends AbstractExtension {
    _rect;
    constructor(extensionManager, designerView, extendedItem) {
        super(extensionManager, designerView, extendedItem);
    }
    extend() {
        this.refresh();
    }
    refresh() {
        const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
        this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-rect-enter-container', this._rect, OverlayLayer.Background);
    }
    dispose() {
        this._removeAllOverlays();
    }
}
//# sourceMappingURL=GrayOutDragOverContainerExtension.js.map