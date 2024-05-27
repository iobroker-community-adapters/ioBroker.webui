import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { SelectionToolPopup } from "../popups/SelectionToolPopup.js";
export class SelectorToolButtonProvider {
    provideButton(designerCanvas) {
        const button = new DesignerToolbarButton(designerCanvas, {
            'RectangleSelector': { icon: assetsPath + 'images/tools/SelectRectTool.svg' },
            'MagicWandSelector': { icon: assetsPath + 'images/tools/MagicWandTool.svg' }
        });
        button.popup = SelectionToolPopup;
        return button;
    }
}
//# sourceMappingURL=SelectorToolButtonProvider.js.map