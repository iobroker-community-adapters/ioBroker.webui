import { BasePropertyEditor } from './BasePropertyEditor.js';
export class NumberPropertyEditor extends BasePropertyEditor {
    constructor(property) {
        super(property);
        let element = document.createElement('input');
        element.type = "number";
        if (property.readonly)
            element.readOnly = true;
        element.min = property.min;
        element.max = property.max;
        element.step = property.step;
        element.onchange = (e) => this._valueChanged(element.value == '' ? null : element.valueAsNumber);
        this.element = element;
    }
    refreshValue(valueType, value) {
        this.element.value = value === undefined ? null : value;
    }
}
//# sourceMappingURL=NumberPropertyEditor.js.map