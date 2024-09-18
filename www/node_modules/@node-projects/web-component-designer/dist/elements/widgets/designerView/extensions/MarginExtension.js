import { AbstractExtension } from './AbstractExtension.js';
import { OverlayLayer } from './OverlayLayer.js';
export class MarginExtension extends AbstractExtension {
    constructor(extensionManager, designerView, extendedItem) {
        super(extensionManager, designerView, extendedItem);
    }
    _path;
    _path2;
    extend(cache, event) {
        this.refresh(cache, event);
    }
    refresh(cache, event) {
        const computedStyle = getComputedStyle(this.extendedItem.element);
        if (computedStyle.margin !== '0px') {
            const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
            const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
            const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
            const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));
            if (!isNaN(left) && !isNaN(top) && !isNaN(right) && !isNaN(bottom)) {
                const p = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
                if (!isNaN(p.p1.x)) {
                    if (this._valuesHaveChanges(left, top, right, bottom, p.p1.x, p.p1.y, p.p2.x, p.p2.y, p.p3.x, p.p3.y, p.p4.x, p.p4.y)) {
                        const p2 = this.extendedItem.element.getBoxQuads({ box: 'margin', relativeTo: this.designerCanvas.canvas })[0];
                        let d = "M" + [p.p1, p.p2, p.p3, p.p4].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
                        d += "M" + [p2.p1, p2.p2, p2.p3, p2.p4].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
                        this._path = this._drawPath(d, 'svg-margin-fill', this._path, OverlayLayer.Background);
                        this._path2 = this._drawPath(d, 'svg-margin', this._path2, OverlayLayer.Background);
                    }
                }
            }
        }
    }
    dispose() {
        this._removeAllOverlays();
    }
}
//# sourceMappingURL=MarginExtension.js.map