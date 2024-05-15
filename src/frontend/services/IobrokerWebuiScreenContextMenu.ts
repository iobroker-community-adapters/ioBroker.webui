import { ContextmenuInitiator, IContextMenuExtension, IContextMenuItem, IDesignItem, IDesignerCanvas } from '@node-projects/web-component-designer';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { ScreenViewer } from '../runtime/ScreenViewer.js';
import { IScreen } from '../interfaces/IScreen.js';

export class IobrokerWebuiScreenContextMenu implements IContextMenuExtension {

    public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
        return designItem && !designItem.isRootItem && designItem.element instanceof ScreenViewer;
    }

    public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
        return [
            {
                title: 'edit screen', action: () => {
                    let nm = (<ScreenViewer>designItem.element).screenName;
                    iobrokerHandler.getWebuiObject<IScreen>('screen', nm).then(s => {
                        window.appShell.openScreenEditor(nm, 'screen', s.html, s.style, s.script, s.settings, null);
                    });
                }, shortCut: 'Ctrl + E'
            },
        ]
    }
}