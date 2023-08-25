function findPanelContainerElement(element) {
    if (!element)
        return null;
    let dlg = element;
    while (dlg != null && dlg.className !== 'panel-content' && !dlg._dockSpawnPanelContainer) {
        if (dlg.parentElement == null && dlg.parentNode != null && dlg.parentNode.host != null) {
            dlg = dlg.parentNode.host;
        }
        else {
            dlg = dlg.parentElement;
        }
    }
    return dlg;
}
export function getPanelContainerForElement(element) {
    if (!element)
        return null;
    return findPanelContainerElement(element)?._dockSpawnPanelContainer;
}
