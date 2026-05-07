export class BasicContextMenu {
    _item;
    _shouldProvide;
    constructor(item, shouldProvide) {
        this._item = item;
        this._shouldProvide = shouldProvide || (() => true);
    }
    shouldProvideContextmenu(event, designerCanvas, designItem, initiator) {
        return this._shouldProvide(event, designerCanvas, designItem, initiator);
    }
    provideContextMenuItems(event, designerCanvas, designItem, initiator) {
        return [{ ...this._item, action: (e) => this._item.action?.(e, designerCanvas, designItem, initiator) }];
    }
}
//# sourceMappingURL=BasicContextMenu.js.map