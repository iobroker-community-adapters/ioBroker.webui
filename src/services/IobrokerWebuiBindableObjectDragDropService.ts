import { DesignItem, IBindableObject, IBindableObjectDragDropService, IDesignerCanvas, InsertAction } from "@node-projects/web-component-designer";

export class IobrokerWebuiBindableObjectDragDropService implements IBindableObjectDragDropService {
    dragOver(event: DragEvent, bindableObject: IBindableObject<void>): "none" | "copy" | "link" | "move" {
        return 'copy';
    }

    async drop(designerView: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<void>) {
        const position = designerView.getNormalizedEventCoordinates(event);
        const input = document.createElement('input');
        const di = DesignItem.createDesignItemFromInstance(input, designerView.serviceContainer, designerView.instanceServiceContainer);
        const grp = di.openGroup("Insert");
        di.setAttribute('value', "[[this.objects['" + bindableObject.fullName + "']]]")
        di.setStyle('position', 'absolute');
        di.setStyle('left', position.x + 'px');
        di.setStyle('top', position.y + 'px');
        designerView.instanceServiceContainer.undoService.execute(new InsertAction(designerView.rootDesignItem, designerView.rootDesignItem.childCount, di));
        grp.commit();
        requestAnimationFrame(() => designerView.instanceServiceContainer.selectionService.setSelectedElements([di]));
    }
}