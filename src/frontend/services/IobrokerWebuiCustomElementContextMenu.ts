import { ContextmenuInitiator, IContextMenuExtension, IContextMenuItem, IDesignItem, IDesignerCanvas } from '@node-projects/web-component-designer';
import { BaseCustomControl, CustomControlInfo, webuiCustomControlSymbol } from '../runtime/CustomControls.js';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { IControl } from '../interfaces/IControl.js';

export class IobrokerWebuiCustomElementContextMenu implements IContextMenuExtension {

    public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
        return designItem && !designItem.isRootItem && designItem.element instanceof BaseCustomControl;
    }

    public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
        return [
            {
                title: 'edit custom element', action: () => {
                    let ccInfo = (<CustomControlInfo>(<any>designItem.element.constructor)[webuiCustomControlSymbol]);
                    iobrokerHandler.getWebuiObject<IControl>('control', ccInfo.name).then(s => {
                        window.appShell.openScreenEditor(ccInfo.name, 'control', s.html, s.style, s.script, s.settings, s.properties);
                    });
                }, shortCut: 'Ctrl + E'
            },
        ]
    }
}