import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { NodeType } from '../../../../item/NodeType.js';
import { assetsPath } from '../../../../../Constants.js';
export class ZMoveContextMenu {
    shouldProvideContextmenu(event, designerCanvas, designItem, initiator) {
        if (designerCanvas.readOnly)
            return false;
        return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
    }
    provideContextMenuItems(event, designerCanvas, designItem) {
        return [
            { title: 'to front', icon: `<img style="rotate: 90deg" src="${assetsPath + 'icons/moveFirst.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.moveToFront }); } },
            { title: 'move forward', icon: `<img style="rotate: 90deg" src="${assetsPath + 'icons/moveLeft.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.moveForward }); } },
            { title: 'move backward', icon: `<img style="rotate: 270deg" src="${assetsPath + 'icons/moveLeft.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.moveBackward }); } },
            { title: 'to back', icon: `<img style="rotate: 270deg" src="${assetsPath + 'icons/moveFirst.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.moveToBack }); } },
        ];
    }
}
//# sourceMappingURL=ZMoveContextMenu.js.map