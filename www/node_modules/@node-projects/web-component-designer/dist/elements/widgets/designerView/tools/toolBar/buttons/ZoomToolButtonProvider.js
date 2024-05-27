import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
export class ZoomToolButtonProvider {
    provideButton(designerCanvas) {
        return new DesignerToolbarButton(designerCanvas, { 'Zoom': { icon: assetsPath + 'images/tools/ZoomTool.svg' } });
    }
}
//# sourceMappingURL=ZoomToolButtonProvider.js.map