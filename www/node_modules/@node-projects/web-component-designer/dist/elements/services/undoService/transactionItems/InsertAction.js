export class InsertAction {
    constructor(containerItem, index, newItem) {
        this.title = "Insert Item";
        this.containerItem = containerItem;
        this.index = index;
        this.newItem = newItem;
    }
    title;
    get affectedItems() {
        return [this.containerItem, this.newItem];
    }
    undo() {
        this.newItem.parent._removeChildInternal(this.newItem);
        return [{ changeType: 'removed', designItems: [this.newItem] }];
    }
    do() {
        this.containerItem._insertChildInternal(this.newItem, this.index);
        return [{ changeType: 'added', designItems: [this.newItem] }];
    }
    containerItem;
    index;
    newItem;
    mergeWith(other) {
        return false;
    }
}
//# sourceMappingURL=InsertAction.js.map