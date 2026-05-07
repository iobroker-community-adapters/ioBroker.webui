import { SkewExtension } from './SkewExtension.js';
import { css } from '@node-projects/base-custom-webcomponent';
export class SkewExtensionProvider {
    shouldExtend(extensionManager, designerCanvas, designItem) {
        if (designerCanvas.readOnly)
            return false;
        if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement) {
            return false;
        }
        return !designItem.isRootItem;
    }
    getExtension(extensionManager, designerCanvas, designItem) {
        return new SkewExtension(extensionManager, designerCanvas, designItem);
    }
    static style = css `
    .svg-primary-skew { stroke: #3899ec; fill: white; stroke-width: 1; pointer-events: auto; }
    .svg-primary-skew-line { stroke: #3899ec; fill: none; stroke-width: 1; }
  `;
}
//# sourceMappingURL=SkewExtensionProvider.js.map