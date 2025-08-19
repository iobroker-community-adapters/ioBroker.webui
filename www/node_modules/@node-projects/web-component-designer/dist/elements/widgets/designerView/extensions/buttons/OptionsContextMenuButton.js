import { ContextMenu } from "../../../../helper/contextMenu/ContextMenu.js";
export class OptionsContextMenuButton {
    constructor() {
    }
    provideButtons(designerView, designerCanvas) {
        const btn = document.createElement('div');
        btn.innerHTML = 'O';
        btn.title = 'options';
        btn.className = 'toolbar-control';
        btn.onclick = (e) => {
            this.showCtxMenu(e, designerCanvas);
        };
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            this.showCtxMenu(e, designerCanvas);
        };
        return [btn];
    }
    prepareContextMenu(event, designerCanvas) {
        const ctxMenu = [
            {
                title: 'simulate hover on hover', checked: designerCanvas.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover, action: () => {
                    designerCanvas.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover = !designerCanvas.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover;
                }
            },
            {
                title: 'select unhitable elements', checked: designerCanvas.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements, action: () => {
                    designerCanvas.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements = !designerCanvas.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements;
                }
            },
            {
                title: 'pause animations', checked: designerCanvas.pauseAnimations, action: () => {
                    designerCanvas.pauseAnimations = !designerCanvas.pauseAnimations;
                }
            },
            {
                title: 'hide overflowing content', checked: designerCanvas.instanceServiceContainer.designContext.extensionOptions.hideOverflowingContent, action: () => {
                    designerCanvas.instanceServiceContainer.designContext.extensionOptions.hideOverflowingContent = !designerCanvas.instanceServiceContainer.designContext.extensionOptions.hideOverflowingContent;
                    if (designerCanvas.instanceServiceContainer.designContext.extensionOptions.hideOverflowingContent) {
                        for (let c of designerCanvas.rootDesignItem.children(true)) {
                            if (c.element instanceof HTMLElement) {
                                c.element.style.overflow = 'hidden';
                                c.element.style.whiteSpace = 'nowrap';
                            }
                        }
                    }
                    else {
                        for (let c of designerCanvas.rootDesignItem.children(true)) {
                            if (c.element instanceof HTMLElement) {
                                c.element.style.overflow = c.hasStyle('overflow') ? c.getStyle('overflow') : '';
                                c.element.style.whiteSpace = c.hasStyle('white-space') ? c.getStyle('white-space') : '';
                            }
                        }
                    }
                }
            },
        ];
        return ctxMenu;
    }
    showCtxMenu(event, designerCanvas) {
        ContextMenu.show(this.prepareContextMenu(event, designerCanvas), event);
    }
}
//# sourceMappingURL=OptionsContextMenuButton.js.map