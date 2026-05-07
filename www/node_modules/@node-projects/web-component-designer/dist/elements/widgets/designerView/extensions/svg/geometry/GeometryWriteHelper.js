function hasStyleTarget(element) {
    return 'style' in element;
}
export function applyGeometryWritesToElement(element, writes) {
    for (const write of writes) {
        if (write.target === 'style' && hasStyleTarget(element)) {
            element.style.setProperty(write.attribute, write.value);
        }
        else {
            element.setAttribute(write.attribute, write.value);
        }
    }
}
export function applyGeometryWritesToDesignItem(designItem, writes) {
    for (const write of writes) {
        if (write.target === 'style') {
            designItem.setStyle(write.attribute, write.value);
        }
        else {
            designItem.setAttribute(write.attribute, write.value);
        }
    }
}
//# sourceMappingURL=GeometryWriteHelper.js.map