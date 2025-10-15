import { assetsPath } from '../../../../../Constants.js';
export class JumpToElementContextMenu {
    shouldProvideContextmenu(event, designerCanvas, designItem, initiator) {
        return designItem !== null;
    }
    provideContextMenuItems(event, designerCanvas, designItem) {
        return [
            {
                title: 'jump to', icon: `<img src="${assetsPath + 'icons/jump.svg'}">`, action: () => {
                    const coord = designerCanvas.getNormalizedElementCoordinates(designItem.element);
                    designerCanvas.zoomPoint({ x: coord.x + coord.width / 2, y: coord.y + coord.height / 2 }, designerCanvas.zoomFactor);
                }
            },
        ];
    }
}
//# sourceMappingURL=JumpToElementContextMenu.js.map