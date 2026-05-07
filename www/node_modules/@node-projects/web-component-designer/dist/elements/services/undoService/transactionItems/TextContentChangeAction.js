export class TextContentChangeAction {
    constructor(designItem, newValue, oldValue) {
        this.title = "Change TextContent from '" + oldValue + "' to '" + newValue + "'";
        this.designItem = designItem;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }
    title;
    get affectedItems() {
        return [this.designItem];
    }
    undo() {
        this.designItem.element.textContent = this.oldValue;
        return [{ changeType: 'changed', designItems: this.affectedItems, type: 'property', name: 'textContent', oldValue: this.newValue, newValue: this.oldValue }];
    }
    do() {
        this.designItem.element.textContent = this.newValue;
        return [{ changeType: 'changed', designItems: this.affectedItems, type: 'property', name: 'textContent', oldValue: this.oldValue, newValue: this.newValue }];
    }
    designItem;
    newValue;
    oldValue;
    mergeWith(other) {
        return false;
    }
}
//# sourceMappingURL=TextContentChangeAction.js.map