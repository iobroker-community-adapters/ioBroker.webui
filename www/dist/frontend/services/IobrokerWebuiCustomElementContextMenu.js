import { BaseCustomControl, webuiCustomControlSymbol } from '../runtime/CustomControls.js';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
export class IobrokerWebuiCustomElementContextMenu {
    shouldProvideContextmenu(event, designerView, designItem, initiator) {
        return !designItem.isRootItem && designItem.element instanceof BaseCustomControl;
    }
    provideContextMenuItems(event, designerView, designItem) {
        return [
            {
                title: 'edit custom element', action: () => {
                    let ccInfo = designItem.element.constructor[webuiCustomControlSymbol];
                    iobrokerHandler.getCustomControl(ccInfo.name).then(s => {
                        window.appShell.openScreenEditor(ccInfo.name, 'control', s.html, s.style, s.typeScript ?? s.script, s.settings, s.properties);
                    });
                }, shortCut: 'Ctrl + E'
            },
        ];
    }
}
