import { AbstractExtension } from './AbstractExtension.js';
import { OverlayLayer } from './OverlayLayer.js';
export class HighlightElementExtension extends AbstractExtension {
    _rect;
    constructor(extensionManager, designerView, extendedItem) {
        super(extensionManager, designerView, extendedItem);
    }
    extend() {
        this.refresh();
    }
    refresh() {
        const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
        if (!isNaN(transformedCornerPoints.p1.x)) {
            this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-hover', this._rect, OverlayLayer.Background);
            this._rect.style.strokeWidth = (3 / this.designerCanvas.scaleFactor).toString();
        }
    }
    dispose() {
        this._removeAllOverlays();
    }
}
//# sourceMappingURL=HighlightElementExtension.js.map