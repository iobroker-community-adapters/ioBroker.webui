import { IProperty, IDesignItem, IPropertyGridDragDropService } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiPropertyGridDragDropService implements IPropertyGridDragDropService {
    rectMap: Map<Element, SVGRectElement>;
    rect: SVGRectElement;
    dragOverOnProperty?(event: DragEvent, property: IProperty, designItems: IDesignItem[]): 'none' | 'copy' | 'link' | 'move';
    dropOnProperty?(event: DragEvent, property: IProperty, dropObject: any, designItems: IDesignItem[]): void;
}
