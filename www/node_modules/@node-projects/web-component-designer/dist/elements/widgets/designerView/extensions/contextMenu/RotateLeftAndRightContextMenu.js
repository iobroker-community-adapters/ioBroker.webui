import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { NodeType } from '../../../../item/NodeType.js';
import { assetsPath } from '../../../../../Constants.js';
export class RotateLeftAndRight {
    shouldProvideContextmenu(event, designerCanvas, designItem, initiator) {
        if (designerCanvas.readOnly)
            return false;
        return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
    }
    provideContextMenuItems(event, designerCanvas, designItem) {
        return [
            { title: 'rotate right', icon: `<img src="${assetsPath + 'icons/rotateRight.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.rotateClockwise }); }, shortCut: 'Ctrl + R' },
            { title: 'rotate left', icon: `<img src="${assetsPath + 'icons/rotateLeft.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.rotateCounterClockwise }); }, shortCut: 'Ctrl + Shift + R' }
        ];
    }
}
//# sourceMappingURL=RotateLeftAndRightContextMenu.js.map