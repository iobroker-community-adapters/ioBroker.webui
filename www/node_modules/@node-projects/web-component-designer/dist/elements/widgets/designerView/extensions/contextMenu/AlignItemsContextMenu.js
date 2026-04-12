import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { NodeType } from '../../../../item/NodeType.js';
import { assetsPath } from '../../../../../Constants.js';
export class AlignItemsContextMenu {
    shouldProvideContextmenu(event, designerCanvas, designItem, initiator) {
        if (designerCanvas.readOnly)
            return false;
        if (designItem?.instanceServiceContainer.selectionService.selectedElements.length > 1) {
            return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
        }
        return false;
    }
    provideContextMenuItems(event, designerCanvas, designItem) {
        return [
            { title: 'align left', icon: `<img src="${assetsPath + 'icons/alignHorizontalLeft.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.arrangeLeft }); } },
            { title: 'align center', icon: `<img src="${assetsPath + 'icons/alignHorizontalCenter.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.arrangeCenter }); } },
            { title: 'align right', icon: `<img src="${assetsPath + 'icons/alignHorizontalRight.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.arrangeRight }); } },
            { title: 'distribute horizontal', icon: `<img src="${assetsPath + 'icons/horizontalDistribute.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.distributeHorizontal }); } },
            { title: 'align top', icon: `<img src="${assetsPath + 'icons/alignVerticalTop.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.arrangeTop }); } },
            { title: 'align middle', icon: `<img src="${assetsPath + 'icons/alignVerticalCenter.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.arrangeMiddle }); } },
            { title: 'align bottom', icon: `<img src="${assetsPath + 'icons/alignVerticalBottom.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.arrangeBottom }); } },
            { title: 'distribute vertical', icon: `<img src="${assetsPath + 'icons/verticalDistribute.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.distributeVertical }); } },
        ];
    }
}
//# sourceMappingURL=AlignItemsContextMenu.js.map