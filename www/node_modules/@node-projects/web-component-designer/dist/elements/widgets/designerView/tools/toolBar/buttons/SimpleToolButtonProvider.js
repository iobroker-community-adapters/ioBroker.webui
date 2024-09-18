import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
export class SimpleToolButtonProvider {
    _name;
    _icon;
    constructor(name, icon) {
        this._name = name;
        this._icon = icon;
    }
    provideButton(designerCanvas) {
        let obj = {};
        obj[this._name] = { icon: this._icon };
        return new DesignerToolbarButton(designerCanvas, obj);
    }
}
//# sourceMappingURL=SimpleToolButtonProvider.js.map