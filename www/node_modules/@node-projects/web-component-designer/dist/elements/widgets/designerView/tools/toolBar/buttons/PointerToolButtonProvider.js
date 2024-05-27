import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { PointerToolPopup } from "../popups/PointerToolPopup.js";
export class PointerToolButtonProvider {
    provideButton(designerCanvas) {
        const button = new DesignerToolbarButton(designerCanvas, { 'Pointer': { icon: assetsPath + 'images/tools/PointerTool.svg' } });
        button.popup = PointerToolPopup;
        return button;
    }
}
//# sourceMappingURL=PointerToolButtonProvider.js.map