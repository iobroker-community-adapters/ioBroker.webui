export class StylesheetChangedAction {
    stylesheetService;
    constructor(stylesheetService, name, newValue, oldValue) {
        this.title = "Changed Css Stylesheet: " + name;
        this.stylesheetService = stylesheetService;
        this.name = name;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }
    title;
    get affectedItems() {
        return [];
    }
    undo() {
        this.stylesheetService.updateCompleteStylesheetWithoutUndo(this.name, this.oldValue);
        return null;
    }
    do() {
        this.stylesheetService.updateCompleteStylesheetWithoutUndo(this.name, this.newValue);
        return null;
    }
    name;
    newValue;
    oldValue;
    mergeWith(other) { return false; }
}
//# sourceMappingURL=StylesheetChangedAction.js.map