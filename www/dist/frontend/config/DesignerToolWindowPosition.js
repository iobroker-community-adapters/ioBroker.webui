import { DraggableToolWindow } from '@node-projects/web-component-designer';
import { fitDialogPosition } from '../helper/DialogPositionHelper.js';
// Upstream centers every tool as if it were 260px wide. The border-radius
// editor is 860px wide, which can put its title-bar Close outside the viewport.
const showWindow = DraggableToolWindow.showWindow;
DraggableToolWindow.showWindow = (instance, anchor) => {
    showWindow(instance, anchor);
    const view = instance.ownerDocument.defaultView;
    const rect = instance.getBoundingClientRect();
    const position = fitDialogPosition(rect.x, rect.y, rect.width, rect.height, {
        left: 8, top: 8, width: view.innerWidth - 16, height: view.innerHeight - 16
    });
    instance.style.left = position.x + 'px';
    instance.style.top = position.y + 'px';
};
