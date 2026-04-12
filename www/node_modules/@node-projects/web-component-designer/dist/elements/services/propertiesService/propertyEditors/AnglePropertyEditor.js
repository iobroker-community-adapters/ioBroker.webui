import { BasePropertyEditor } from './BasePropertyEditor.js';
export class AnglePropertyEditor extends BasePropertyEditor {
    constructor(property) {
        super(property);
        let element = document.createElement('input');
        element.type = "number";
        if (property.readonly)
            element.readOnly = true;
        element.min = property.min ?? '0';
        element.max = property.max ?? '360';
        element.step = property.step;
        element.onchange = (e) => this._valueChanged(element.value == '' ? null : (element.valueAsNumber + 'deg'));
        this.element = element;
    }
    refreshValue(valueType, value) {
        this.element.valueAsNumber = value === undefined ? null : parseFloat(value);
    }
}
//# sourceMappingURL=AnglePropertyEditor.js.map