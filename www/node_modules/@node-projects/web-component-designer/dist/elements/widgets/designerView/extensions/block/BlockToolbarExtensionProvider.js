import { BlockToolbarExtension } from './BlockToolbarExtension.js';
import { NodeType } from '../../../../item/NodeType.js';
import { basicStackedToolbarExtensionOverlayOptionName } from '../BasicStackedToolbarExtension.js';
export class BlockToolbarExtensionProvider {
    shouldExtend(extensionManager, designerCanvas, designItem) {
        if (designItem.nodeType === NodeType.Element) {
            const d = getComputedStyle(designItem.element).display;
            if (d === 'block' || d === 'inline' || d === 'inline-block')
                return designerCanvas.instanceServiceContainer.designContext.extensionOptions[basicStackedToolbarExtensionOverlayOptionName] !== false;
        }
        return false;
    }
    getExtension(extensionManager, designerView, designItem) {
        return new BlockToolbarExtension(extensionManager, designerView, designItem);
    }
}
//# sourceMappingURL=BlockToolbarExtensionProvider.js.map