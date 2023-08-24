import { ExternalDragDropService, IDesignerCanvas } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiExternalDragDropService extends ExternalDragDropService {
    drop(designerCanvas: IDesignerCanvas, event: DragEvent): Promise<void>;
}
