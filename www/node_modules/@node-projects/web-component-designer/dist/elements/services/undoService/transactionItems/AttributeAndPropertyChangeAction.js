export class AttributeAndPropertyChangeAction {
    constructor(designItem, attributeName, propertyName, newValue, oldValue) {
        this.title = "Change Attribute & Property" + attributeName + " of &lt;" + designItem.name + "&gt;";
        this.designItem = designItem;
        this.attributeName = attributeName;
        this.propertyName = propertyName;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }
    title;
    get affectedItems() {
        return [this.designItem];
    }
    undo() {
        this.designItem.element[this.propertyName] = this.oldValue;
        if (this.oldValue == null) {
            this.designItem._withoutUndoRemoveAttribute(this.attributeName);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.newValue, newValue: null }];
        }
        else {
            let val = this.oldValue;
            if (typeof this.oldValue !== 'string')
                val = this.oldValue.toString();
            this.designItem._withoutUndoSetAttribute(this.attributeName, val);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.newValue, newValue: val }];
        }
    }
    do() {
        this.designItem.element[this.propertyName] = this.newValue;
        if (this.newValue == null) {
            this.designItem._withoutUndoRemoveAttribute(this.attributeName);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.newValue, newValue: null }];
        }
        else {
            let val = this.newValue;
            if (typeof this.newValue !== 'string')
                val = this.newValue.toString();
            this.designItem._withoutUndoSetAttribute(this.attributeName, val);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.oldValue, newValue: val }];
        }
    }
    designItem;
    attributeName;
    propertyName;
    newValue;
    oldValue;
    mergeWith(other) {
        if (other instanceof AttributeAndPropertyChangeAction && this.designItem === other.designItem && this.attributeName === other.attributeName && this.propertyName === other.propertyName) {
            this.newValue = other.newValue;
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=AttributeAndPropertyChangeAction.js.map