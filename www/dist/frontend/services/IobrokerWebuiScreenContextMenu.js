import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { ScreenViewer } from '../runtime/ScreenViewer.js';
export class IobrokerWebuiScreenContextMenu {
    shouldProvideContextmenu(event, designerView, designItem, initiator) {
        return designItem && !designItem.isRootItem && designItem.element instanceof ScreenViewer;
    }
    provideContextMenuItems(event, designerView, designItem) {
        return [
            {
                title: 'edit screen', action: () => {
                    let nm = designItem.element.screenName;
                    iobrokerHandler.getWebuiObject('screen', nm).then(s => {
                        window.appShell.openScreenEditor(nm, 'screen', s.html, s.style, s.script, s.settings, s.properties);
                    });
                }, shortCut: 'Ctrl + E'
            },
        ];
    }
}
