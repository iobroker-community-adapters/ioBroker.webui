import { PanelContainer } from "dock-spawn-ts/lib/js/PanelContainer";

function findPanelContainerElement(element: Element): Element & { _dockSpawnPanelContainer?: PanelContainer; _result?: any } {
    if (!element) return null;
    let dlg = element;
    while (dlg != null && dlg.className !== 'panel-content' && !(<any>dlg)._dockSpawnPanelContainer) {
        if (dlg.parentElement == null && dlg.parentNode != null && (<any>dlg.parentNode).host != null) {
            dlg = (<any>dlg.parentNode).host;
        } else {
            dlg = dlg.parentElement;
        }
    }
    return <any>dlg;
}

export function getPanelContainerForElement(element: Element): PanelContainer {
    if (!element) return null;
    return findPanelContainerElement(element)?._dockSpawnPanelContainer;
}