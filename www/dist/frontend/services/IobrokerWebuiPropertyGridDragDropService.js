export class IobrokerWebuiPropertyGridDragDropService {
    rectMap = new Map();
    rect;
    dragOverOnProperty(event, property, designItems) {
        return 'copy';
    }
    dropOnProperty(event, property, dropObject, designItems) {
        property.service.setValue(designItems, property, dropObject.text);
    }
}
