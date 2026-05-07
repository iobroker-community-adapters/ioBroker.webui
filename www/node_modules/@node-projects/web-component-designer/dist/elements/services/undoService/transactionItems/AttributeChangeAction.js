export class AttributeChangeAction {
    constructor(designItem, name, newValue, oldValue) {
        this.title = "Change Attribute " + name + " of &lt;" + designItem.name + "&gt;";
        this.designItem = designItem;
        this.name = name;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }
    title;
    get affectedItems() {
        return [this.designItem];
    }
    undo() {
        if (this.oldValue == null) {
            this.designItem._withoutUndoRemoveAttribute(this.name);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.newValue, newValue: null }];
        }
        else {
            let val = this.oldValue;
            if (typeof this.oldValue !== 'string')
                val = this.oldValue.toString();
            this.designItem._withoutUndoSetAttribute(this.name, val);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.newValue, newValue: val }];
        }
    }
    do() {
        if (this.newValue == null) {
            this.designItem._withoutUndoRemoveAttribute(this.name);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.newValue, newValue: null }];
        }
        else {
            let val = this.newValue;
            if (typeof this.newValue !== 'string')
                val = this.newValue.toString();
            this.designItem._withoutUndoSetAttribute(this.name, val);
            return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.oldValue, newValue: val }];
        }
    }
    designItem;
    name;
    newValue;
    oldValue;
    mergeWith(other) {
        if (other instanceof AttributeChangeAction && this.designItem === other.designItem && this.name === other.name) {
            this.newValue = other.newValue;
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=AttributeChangeAction.js.map