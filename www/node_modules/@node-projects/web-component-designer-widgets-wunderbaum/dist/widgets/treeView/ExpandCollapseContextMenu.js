import { assetsPath } from "../../Constants.js";
export class ExpandCollapseContextMenu {
    shouldProvideContextmenu(event, designerView, designItem, initiator) {
        if (initiator == 'treeView') {
            return true;
        }
        return false;
    }
    provideContextMenuItems(event, designerView, designItem, initiator, provider) {
        return [
            {
                title: 'collapse children', icon: `<img src="${assetsPath + 'icons/collapse.svg'}">`, action: () => {
                    provider.collapseChildren(designItem);
                }
            },
            {
                title: 'expand children', icon: `<img src="${assetsPath + 'icons/expand.svg'}">`, action: () => {
                    provider.expandChildren(designItem);
                }
            },
        ];
    }
}
