export class ConditionExtensionProvider {
    constructor(extensionProvider, condition, recheckOnRefresh = false) {
        this.extensionProvider = extensionProvider;
        this.condition = condition;
        this.style = extensionProvider.style ?? extensionProvider.constructor.style;
        this.svgDefs = extensionProvider.svgDefs ?? extensionProvider.constructor.svgDefs;
    }
    extensionProvider;
    condition;
    style;
    svgDefs;
    shouldExtend(extensionManager, designerCanvas, designItem) {
        if (!this.condition(designItem, designerCanvas))
            return false;
        return this.extensionProvider.shouldExtend(extensionManager, designerCanvas, designItem);
    }
    getExtension(extensionManager, designerCanvas, designItem) {
        return this.extensionProvider.getExtension(extensionManager, designerCanvas, designItem);
    }
}
//# sourceMappingURL=ConditionExtensionProvider.js.map