import { OverlayLayer, DesignItem, InsertAction } from '/webui/node_modules/@node-projects/web-component-designer/./dist/index.js';
import { BindingTarget } from '/webui/node_modules/@node-projects/web-component-designer/dist/elements/item/BindingTarget.js';
import { IobrokerWebuiBindingsHelper } from '../helper/IobrokerWebuiBindingsHelper.js';
export class IobrokerWebuiBindableObjectDragDropService {
    rectMap = new Map();
    rect;
    dragEnter(designerCanvas, event) {
        const element = event.composedPath()[0];
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            let itemRect = designerCanvas.getNormalizedElementCoordinates(element);
            this.rect = designerCanvas.overlayLayer.drawRect(itemRect.x, itemRect.y, itemRect.width, itemRect.height, '', null, OverlayLayer.Background);
            this.rect.style.fill = '#ff0000';
            this.rect.style.opacity = '0.3';
            this.rectMap.set(element, this.rect);
        }
    }
    dragLeave(designerCanvas, event) {
        const element = event.composedPath()[0];
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            const rect = this.rectMap.get(element);
            designerCanvas.overlayLayer.removeOverlay(rect);
            this.rectMap.delete(element);
        }
    }
    dragOver(designerView, event) {
        return 'copy';
    }
    async drop(designerCanvas, event, bindableObject) {
        for (let r of this.rectMap.values()) {
            designerCanvas.overlayLayer.removeOverlay(r);
        }
        this.rectMap.clear();
        const element = event.composedPath()[0];
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            // Add binding to drop target...
            if (element instanceof HTMLInputElement) {
                const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
                const serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(element, element.type == 'checkbox' ? 'checked' : 'value', binding);
                designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
            }
            else {
                const binding = { signal: bindableObject.fullName, target: BindingTarget.content };
                const serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(element, null, binding);
                designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
            }
        }
        else {
            const position = designerCanvas.getNormalizedEventCoordinates(event);
            const input = document.createElement('input');
            const di = DesignItem.createDesignItemFromInstance(input, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
            const grp = di.openGroup("Insert");
            const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
            let serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(input, 'value', binding);
            if (bindableObject.originalObject.val === true || bindableObject.originalObject.val === false) {
                serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(input, 'checked', binding);
                di.setAttribute("type", "checkbox");
            }
            di.setAttribute(serializedBinding[0], serializedBinding[1]);
            di.setStyle('position', 'absolute');
            di.setStyle('left', position.x + 'px');
            di.setStyle('top', position.y + 'px');
            designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
            grp.commit();
            requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
        }
    }
}
