import { IBindableObject, IBindableObjectDragDropService, IDesignerCanvas, IProperty, IDesignItem } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiBindableObjectDragDropService implements IBindableObjectDragDropService {
    rectMap: Map<Element, SVGRectElement>;
    rect: SVGRectElement;
    dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): void;
    dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): void;
    dragOver(designerView: IDesignerCanvas, event: DragEvent, element: Element): "none" | "copy" | "link" | "move";
    drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<ioBroker.Object>, element: Element): Promise<void>;
    dragOverOnProperty?(event: DragEvent, property: IProperty, designItems: IDesignItem[]): 'none' | 'copy' | 'link' | 'move';
    dropOnProperty?(event: DragEvent, property: IProperty, bindableObject: IBindableObject<any>, designItems: IDesignItem[]): void;
}
