import { DesignItem, ExternalDragDropService, IDesignerCanvas, InsertAction } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiExternalDragDropService extends ExternalDragDropService {

  override async drop(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (event.dataTransfer.files[0].type.startsWith('image/')) {
      let name = event.dataTransfer.files[0].name ?? 'image_1';
      let ext = event.dataTransfer.files[0].type.substring(6);
      if (ext == 'svg+xml')
        ext = 'svg';
      if (!name.endsWith('.' + ext) || (ext == 'jpeg' && !name.endsWith('.jpg')))
        name = name + '.' + ext;
      await iobrokerHandler.saveImage(name, event.dataTransfer.files[0]);
      let img = document.createElement('img');
      img.src = iobrokerHandler.imagePrefix + name;
      const di = DesignItem.createDesignItemFromInstance(img, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
      let grp = di.openGroup("Insert of &lt;img&gt;");
      di.setStyle('position', 'absolute')
      const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
      di.setStyle('top', event.offsetY + targetRect.top - designerCanvas.containerBoundingRect.y + 'px')
      di.setStyle('left', event.offsetX + targetRect.left - designerCanvas.containerBoundingRect.x + 'px')
      designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
      grp.commit();
      requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
    }
  }
}