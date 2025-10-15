import { BasePropertyEditor } from './BasePropertyEditor.js';
export class FontPropertyEditor extends BasePropertyEditor {
    static fontList;
    constructor(property) {
        super(property);
        let element = document.createElement("select");
        if (property.readonly)
            element.disabled = true;
        this.element = element;
        FontPropertyEditor.addFontsToSelect(element);
        this.element.onchange = (e) => this._valueChanged(this.element.value);
    }
    static addFontsToSelect(select) {
        if (FontPropertyEditor.fontList) {
            FontPropertyEditor.parseFontList(select);
            //@ts-ignore
        }
        else if (window.queryLocalFonts) {
            //@ts-ignore
            window.queryLocalFonts().then(x => {
                //@ts-ignore
                FontPropertyEditor.fontList = [...new Set(x.map(y => y.family))];
                FontPropertyEditor.parseFontList(select);
            });
        }
        else {
            FontPropertyEditor.fontList = ["Verdana", "Arial", "Tahoma", "Trebuchet MS", "Times New Roman", "Georgia", "Garamond", "Courier New", "Brush Script MT"];
            FontPropertyEditor.parseFontList(select);
        }
    }
    static parseFontList(select) {
        for (let v of FontPropertyEditor.fontList) {
            let option = document.createElement("option");
            option.value = v;
            option.text = v;
            select.appendChild(option);
        }
    }
    refreshValue(valueType, value) {
        this.element.value = value;
    }
}
//# sourceMappingURL=FontPropertyEditor.js.map