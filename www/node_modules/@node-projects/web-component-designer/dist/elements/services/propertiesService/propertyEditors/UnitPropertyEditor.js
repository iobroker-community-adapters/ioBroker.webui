import { NumericStyleInput } from '../../../controls/NumericStyleInput.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { getCssNumericEditorConfig } from './UnitPropertyEditorConfig.js';
export class UnitPropertyEditor extends BasePropertyEditor {
    constructor(property) {
        super(property);
        const config = getCssNumericEditorConfig(property);
        const selector = new NumericStyleInput();
        selector.units = config?.units ?? property.units ?? [];
        selector.fixedValues = config?.fixedValues ?? property.values;
        selector.unitValueConverter = args => config?.convertValue({ ...args, designItems: this.designItems });
        selector.unitSteps = config?.unitSteps ?? property.unitSteps ?? {};
        selector.step = property.step;
        selector.min = property.min;
        selector.max = property.max;
        selector.readOnly = property.readonly;
        selector.valueChanged.on(async (e) => this._valueChanged(e.newValue === '' ? null : e.newValue));
        selector.valuePreviewChanged.on(async (e) => this._previewValueChanged(e.newValue === '' ? null : e.newValue));
        selector.valuePreviewFinished.on(async (e) => {
            await this._removePreviewValue();
            if (e.wasCancelled)
                return;
            await this._valueChanged(e.newValue === '' ? null : e.newValue);
        });
        this.element = selector;
    }
    designItemsChanged(designItems) {
        super.designItemsChanged(designItems);
    }
    refreshValue(valueType, value) {
        this.element.value = value == null ? '' : String(value);
    }
}
//# sourceMappingURL=UnitPropertyEditor.js.map