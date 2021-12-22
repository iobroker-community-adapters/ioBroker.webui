import { OverlayLayer, DesignItem, IBindableObject, IBindableObjectDragDropService, IDesignerCanvas, InsertAction } from "@node-projects/web-component-designer";

export class IobrokerWebuiBindableObjectDragDropService implements IBindableObjectDragDropService {
    rectMap = new Map<Element, SVGRectElement>();
    rect: SVGRectElement;

    dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent) {
        const element = <Element>event.composedPath()[0];
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            let itemRect = designerCanvas.getNormalizedElementCoordinates(element);
            this.rect = designerCanvas.overlayLayer.drawRect(itemRect.x, itemRect.y, itemRect.width, itemRect.height, '', null, OverlayLayer.Background);
            this.rect.style.fill = '#ff0000';
            this.rect.style.opacity = '0.3';
            this.rectMap.set(element, this.rect);
        }
    }

    dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent) {
        const element = <Element>event.composedPath()[0];
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            const rect = this.rectMap.get(element);
            designerCanvas.overlayLayer.removeOverlay(rect);
            this.rectMap.delete(element);
        }
    }

    dragOver(designerView: IDesignerCanvas, event: DragEvent): "none" | "copy" | "link" | "move" {
        return 'copy';
    }

    async drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<void>) {
        for (let r of this.rectMap.values()) {
            designerCanvas.overlayLayer.removeOverlay(r);
        }
        this.rectMap.clear();

        const element = <Element>event.composedPath()[0];
        const designItem = DesignItem.GetDesignItem(element);
        if (designItem && !designItem.isRootItem) {
            // Add binding to drop target...
        } else {
            const position = designerCanvas.getNormalizedEventCoordinates(event);
            const input = document.createElement('input');
            const di = DesignItem.createDesignItemFromInstance(input, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
            const grp = di.openGroup("Insert");
            di.setAttribute('value', "[[this.objects['" + bindableObject.fullName + "']]]")
            di.setStyle('position', 'absolute');
            di.setStyle('left', position.x + 'px');
            di.setStyle('top', position.y + 'px');
            designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
            grp.commit();
            requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
        }
    }
}