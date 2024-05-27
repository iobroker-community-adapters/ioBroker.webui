import { DesignItem } from '../../../../item/DesignItem.js';
export class ItemsBelowContextMenu {
    shouldProvideContextmenu(event, designerView, designItem, initiator) {
        return initiator == 'designer';
    }
    provideContextMenuItems(event, designerCanvas, designItem) {
        const lstItems = designerCanvas.elementsFromPoint(event.x, event.y);
        if (lstItems.length > 0) {
            return [{ title: 'items below', children: [...lstItems.map(x => ({ title: 'select: ' + x.localName + (x.id ? ' (#' + x.id + ')' : ''), action: () => this._select(designerCanvas, x) }))] }];
        }
        return [];
    }
    _select(designerView, element) {
        const item = DesignItem.GetOrCreateDesignItem(element, element, designerView.serviceContainer, designerView.instanceServiceContainer);
        designerView.instanceServiceContainer.selectionService.setSelectedElements([item]);
    }
}
//# sourceMappingURL=ItemsBelowContextMenu.js.map