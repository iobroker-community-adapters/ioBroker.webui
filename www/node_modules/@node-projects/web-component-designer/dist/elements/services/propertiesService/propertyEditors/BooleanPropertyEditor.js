import { BasePropertyEditor } from './BasePropertyEditor.js';
export class BooleanPropertyEditor extends BasePropertyEditor {
    constructor(property) {
        super(property);
        let element = document.createElement('input');
        element.type = "checkbox";
        if (property.readonly)
            element.readOnly = true;
        element.onchange = (e) => this._valueChanged(element.checked);
        this.element = element;
    }
    refreshValue(valueType, value) {
        this.element.checked = value;
    }
}
//# sourceMappingURL=BooleanPropertyEditor.js.map