import { DesignItem, BindingTarget, InsertAction } from "@node-projects/web-component-designer";
import { BindableObjectDragDropService } from "@node-projects/web-component-designer-visualization-addons";
export class IobrokerWebuiBindableObjectDragDropService extends BindableObjectDragDropService {
    async drop(designerCanvas, event, bindableObject, element) {
        const position = designerCanvas.getNormalizedEventCoordinates(event);
        //Special case for ring URL image binding
        if (element == null && bindableObject.name == 'url' && bindableObject.fullName.startsWith('ring.') && bindableObject.fullName.endsWith('Snapshot.url')) {
            let state = await this._visualizationHandler.getState(bindableObject.fullName);
            const img = document.createElement('img');
            let di = DesignItem.createDesignItemFromInstance(img, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
            let grp = di.openGroup("Insert");
            let sn2 = bindableObject.fullName.substring(0, bindableObject.fullName.length - 3) + "moment";
            const binding = { signal: bindableObject.fullName + ';' + sn2, target: BindingTarget.property };
            binding.expression = "__0 + '?' + __1";
            let serializedBinding = this._bindingsHelper.serializeBinding(img, 'src', binding);
            di.setAttribute(serializedBinding[0], serializedBinding[1]);
            di.element.src = state.val;
            di.setStyle('position', 'absolute');
            di.setStyle('left', position.x + 'px');
            di.setStyle('top', position.y + 'px');
            designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
            grp.commit();
            requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
        }
        else {
            return await super.drop(designerCanvas, event, bindableObject, element);
        }
    }
}
