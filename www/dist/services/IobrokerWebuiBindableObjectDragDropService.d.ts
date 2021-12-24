/// <reference types="iobroker" />
import { IBindableObject, IBindableObjectDragDropService, IDesignerCanvas } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiBindableObjectDragDropService implements IBindableObjectDragDropService {
    rectMap: Map<Element, SVGRectElement>;
    rect: SVGRectElement;
    dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent): void;
    dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent): void;
    dragOver(designerView: IDesignerCanvas, event: DragEvent): "none" | "copy" | "link" | "move";
    drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<ioBroker.State>): Promise<void>;
}
