import { css } from '@node-projects/base-custom-webcomponent';
import { ProjectiveTransformExtension } from './ProjectiveTransformExtension.js';
export class ProjectiveTransformExtensionProvider {
    shouldExtend(extensionManager, designerCanvas, designItem) {
        if (designerCanvas.readOnly) {
            return false;
        }
        if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement) {
            return false;
        }
        return !designItem.isRootItem;
    }
    getExtension(extensionManager, designerCanvas, designItem) {
        return new ProjectiveTransformExtension(extensionManager, designerCanvas, designItem);
    }
    static style = css `
    .svg-primary-projective-handle { stroke: #3899ec; fill: white; stroke-width: 1; pointer-events: auto; }
    .svg-primary-projective-handle-cross { stroke: #3899ec; fill: none; stroke-width: 1; stroke-linecap: round; pointer-events: none; }
    .svg-primary-projective-outline { stroke: #3899ec; fill: none; stroke-width: 1; stroke-dasharray: 4 2; }
  `;
}
//# sourceMappingURL=ProjectiveTransformExtensionProvider.js.map