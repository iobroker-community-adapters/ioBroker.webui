import { OverlayLayer, DesignItem, InsertAction, BindingTarget } from "@node-projects/web-component-designer";
import { IobrokerWebuiBindingsHelper } from "../helper/IobrokerWebuiBindingsHelper.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { SvgImage } from "../runtime/SvgImage.js";
export class IobrokerWebuiBindableObjectDragDropService {
    constructor() {
        this.rectMap = new Map();
    }
    dragEnter(designerCanvas, event, element) {
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            let itemRect = designerCanvas.getNormalizedElementCoordinates(element);
            this.rect = designerCanvas.overlayLayer.drawRect('IobrokerWebuiBindableObjectDragDropService', itemRect.x, itemRect.y, itemRect.width, itemRect.height, '', null, OverlayLayer.Background);
            this.rect.style.fill = '#ff0000';
            this.rect.style.opacity = '0.3';
            this.rectMap.set(element, this.rect);
        }
    }
    dragLeave(designerCanvas, event, element) {
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            const rect = this.rectMap.get(element);
            designerCanvas.overlayLayer.removeOverlay(rect);
            this.rectMap.delete(element);
        }
    }
    dragOver(designerView, event, element) {
        return 'copy';
    }
    async drop(designerCanvas, event, bindableObject, element) {
        for (let r of this.rectMap.values()) {
            designerCanvas.overlayLayer.removeOverlay(r);
        }
        this.rectMap.clear();
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            // Add binding to drop target...
            if (element instanceof HTMLInputElement) {
                const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
                const serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(element, element.type == 'checkbox' ? 'checked' : 'value', binding);
                designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
            }
            else if (element instanceof SvgImage) {
                const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
                const serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(element, 'value', binding);
                designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
                if (!designItem.element.name) {
                    designItem.element.name = bindableObject.name;
                    designItem.setAttribute('name', bindableObject.name);
                }
            }
            else {
                const binding = { signal: bindableObject.fullName, target: BindingTarget.content };
                const serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(element, null, binding);
                designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
            }
        }
        else {
            const position = designerCanvas.getNormalizedEventCoordinates(event);
            let di;
            let grp;
            let obj = await iobrokerHandler.connection.getObject(bindableObject.fullName);
            let state = await iobrokerHandler.connection.getState(bindableObject.fullName);
            if (obj?.common?.role === 'url' && typeof state.val === 'string') {
                if (state.val.endsWith('jpg')) {
                    const img = document.createElement('img');
                    di = DesignItem.createDesignItemFromInstance(img, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
                    grp = di.openGroup("Insert");
                    const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
                    let serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(img, 'src', binding);
                    di.setAttribute(serializedBinding[0], serializedBinding[1]);
                    di.setStyle('width', '640px');
                    di.setStyle('height', '480px');
                }
                else if (state.val.endsWith('mp4')) {
                    const video = document.createElement('video');
                    di = DesignItem.createDesignItemFromInstance(video, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
                    grp = di.openGroup("Insert");
                    const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
                    let serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(video, 'src', binding);
                    di.setAttribute(serializedBinding[0], serializedBinding[1]);
                    di.setStyle('width', '640px');
                    di.setStyle('height', '480px');
                }
            }
            if (!di) {
                const input = document.createElement('input');
                di = DesignItem.createDesignItemFromInstance(input, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
                grp = di.openGroup("Insert");
                const binding = { signal: bindableObject.fullName, target: BindingTarget.property };
                let serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(input, 'value', binding);
                if (bindableObject.originalObject.common.type === 'boolean') {
                    serializedBinding = IobrokerWebuiBindingsHelper.serializeBinding(input, 'checked', binding);
                    di.setAttribute("type", "checkbox");
                }
                di.setAttribute(serializedBinding[0], serializedBinding[1]);
            }
            di.setStyle('position', 'absolute');
            di.setStyle('left', position.x + 'px');
            di.setStyle('top', position.y + 'px');
            designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
            grp.commit();
            requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
        }
    }
}
