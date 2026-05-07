export class SetDesignItemsAction {
    constructor(newDesignItems, oldDesignItems) {
        this.title = "Set all DesignItems";
        this.newDesignItems = newDesignItems;
        this.oldDesignItems = oldDesignItems;
    }
    title;
    get affectedItems() {
        return this.newDesignItems;
    }
    undo() {
        this.newDesignItems[0].instanceServiceContainer.designerCanvas._internalSetDesignItems(this.oldDesignItems);
        return null;
    }
    do() {
        this.newDesignItems[0].instanceServiceContainer.designerCanvas._internalSetDesignItems(this.newDesignItems);
        return null;
    }
    newDesignItems;
    oldDesignItems;
    mergeWith(other) {
        return false;
    }
}
//# sourceMappingURL=SetDesignItemsAction.js.map