import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { assetsPath } from '../../../../../Constants.js';
export class CopyPasteContextMenu {
    shouldProvideContextmenu(event, designerView, designItem, initiator) {
        return true;
    }
    provideContextMenuItems(event, designerCanvas, designItem) {
        if (designerCanvas.readOnly)
            return [
                { title: 'copy', icon: `<img src="${assetsPath + 'icons/copy.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.copy }); }, shortCut: 'Ctrl + C', disabled: designItem === null }
            ];
        return [
            { title: 'copy', icon: `<img src="${assetsPath + 'icons/copy.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.copy }); }, shortCut: 'Ctrl + C', disabled: designItem === null },
            { title: 'cut', icon: `<img src="${assetsPath + 'icons/cut.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.cut }); }, shortCut: 'Ctrl + X', disabled: designItem === null },
            { title: 'paste', icon: `<img src="${assetsPath + 'icons/paste.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.paste }); }, shortCut: 'Ctrl + V' },
            { title: 'delete', icon: `<img src="${assetsPath + 'icons/delete.svg'}">`, action: () => { designerCanvas.executeCommand({ type: CommandType.delete }); }, shortCut: 'Del', disabled: designItem === null },
        ];
    }
}
//# sourceMappingURL=CopyPasteContextMenu.js.map