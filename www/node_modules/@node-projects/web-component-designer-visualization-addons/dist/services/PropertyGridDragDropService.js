export class PropertyGridDragDropService {
    dragOverOnProperty(event, property, designItems) {
        return 'copy';
    }
    dropOnProperty(event, property, dropObject, designItems) {
        property.service.setValue(designItems, property, dropObject.text);
    }
}
