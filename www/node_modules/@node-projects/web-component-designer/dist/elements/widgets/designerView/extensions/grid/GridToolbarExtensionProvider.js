import { GridToolbarExtension } from './GridToolbarExtension.js';
import { NodeType } from '../../../../item/NodeType.js';
import { basicStackedToolbarExtensionOverlayOptionName } from '../BasicStackedToolbarExtension.js';
export class GridToolbarExtensionProvider {
    shouldExtend(extensionManager, designerCanvas, designItem) {
        if (designItem.nodeType === NodeType.Element) {
            const d = getComputedStyle(designItem.element).display;
            if (d === 'grid' || d === 'inline-grid')
                return designerCanvas.instanceServiceContainer.designContext.extensionOptions[basicStackedToolbarExtensionOverlayOptionName] !== false;
        }
        return false;
    }
    getExtension(extensionManager, designerView, designItem) {
        return new GridToolbarExtension(extensionManager, designerView, designItem);
    }
}
//# sourceMappingURL=GridToolbarExtensionProvider.js.map