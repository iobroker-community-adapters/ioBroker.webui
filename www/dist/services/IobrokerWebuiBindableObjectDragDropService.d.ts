/// <reference types="iobroker" />
import { IBindableObject, IBindableObjectDragDropService, IDesignerCanvas } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiBindableObjectDragDropService implements IBindableObjectDragDropService {
    rectMap: Map<Element, SVGRectElement>;
    rect: SVGRectElement;
    dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): void;
    dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element): void;
    dragOver(designerView: IDesignerCanvas, event: DragEvent, element: Element): "none" | "copy" | "link" | "move";
    drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<ioBroker.State>, element: Element): Promise<void>;
}
