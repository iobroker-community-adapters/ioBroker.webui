import { DesignItem, hideAtDesignTimeAttributeName, hideAtRunTimeAttributeName, lockAtDesignTimeAttributeName } from "../../item/DesignItem.js";
export class DesignItemService {
    createDesignItem(node, parsedNode, serviceContainer, instanceServiceContainer) {
        return new DesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
    }
    handleSpecialAttributes(attributeName, designItem) {
        if (attributeName == hideAtDesignTimeAttributeName) {
            if (designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).HTMLElement || designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).SVGElement) {
                if (!designItem.hasAttribute(hideAtDesignTimeAttributeName))
                    designItem.element.style.display = designItem.getStyle('display') ?? "";
                else
                    designItem.element.style.display = 'none';
            }
        }
        else if (attributeName == hideAtRunTimeAttributeName) {
            if (designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).HTMLElement || designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).SVGElement) {
                if (!designItem.hasAttribute(hideAtRunTimeAttributeName))
                    designItem.element.style.opacity = designItem.getStyle('opacity') ?? "";
                else
                    designItem.element.style.opacity = '0.3';
            }
        }
        else if (attributeName == lockAtDesignTimeAttributeName) {
            if (designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).HTMLElement || designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).SVGElement) {
                if (!designItem.hasAttribute(lockAtDesignTimeAttributeName))
                    requestAnimationFrame(() => (designItem.element.style.pointerEvents = 'auto'));
                else
                    designItem.element.style.pointerEvents = 'none';
            }
        }
    }
}
//# sourceMappingURL=DesignItemService.js.map