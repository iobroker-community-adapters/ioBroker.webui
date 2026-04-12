import { UnifiedGeometryExtension } from './UnifiedGeometryExtension.js';
import { isVisualSvgElement } from '../../../../helper/SvgHelper.js';
import { css } from '@node-projects/base-custom-webcomponent';
export class UnifiedGeometryExtensionProvider {
    _customReader;
    constructor(customReader) {
        this._customReader = customReader;
    }
    shouldExtend(extensionManager, designerView, designItem) {
        if (this._customReader)
            return true;
        const node = designItem.node;
        if (node instanceof SVGPathElement ||
            node instanceof SVGRectElement ||
            node instanceof SVGLineElement ||
            node instanceof SVGEllipseElement ||
            node instanceof SVGCircleElement ||
            node instanceof SVGPolygonElement ||
            node instanceof SVGPolylineElement) {
            return isVisualSvgElement(node);
        }
        return false;
    }
    getExtension(extensionManager, designerView, designItem) {
        return new UnifiedGeometryExtension(extensionManager, designerView, designItem, this._customReader);
    }
    style = css `
    .svg-control-line {
      stroke: #3899ec;
      fill: none;
      stroke-dasharray: 4;
      pointer-events: none;
      opacity: 0.9;
    }

    .svg-control-point {
      stroke: #3899ec;
      fill: white;
      pointer-events: auto;
    }
  `;
}
//# sourceMappingURL=UnifiedGeometryExtensionProvider.js.map