export class InsertChildAction {
    constructor(designItem, newParent, newIndex) {
        this.title = "Move or Insert Item";
        this.designItem = designItem;
        this.newParent = newParent;
        this.newIndex = newIndex;
    }
    title;
    get affectedItems() {
        if (this.oldParent)
            return [this.designItem, this.newParent, this.oldParent];
        return [this.designItem, this.newParent];
    }
    undo() {
        if (this.oldParent) {
            this.oldParent._insertChildInternal(this.designItem, this.oldIndex);
            return [{ changeType: 'moved', designItems: [this.designItem] }];
        }
        else {
            this.designItem.parent._removeChildInternal(this.designItem);
            return [{ changeType: 'removed', designItems: [this.designItem] }];
        }
    }
    do() {
        this.oldParent = this.designItem.parent;
        if (this.oldParent)
            this.oldIndex = this.designItem.parent.indexOf(this.designItem);
        this.newParent._insertChildInternal(this.designItem, this.newIndex);
        return [{ changeType: this.oldParent ? 'moved' : 'added', designItems: [this.designItem] }];
    }
    designItem;
    newParent;
    newIndex;
    oldParent;
    oldIndex;
    newItem;
    mergeWith(other) {
        return false;
    }
}
//# sourceMappingURL=InsertChildAction.js.map