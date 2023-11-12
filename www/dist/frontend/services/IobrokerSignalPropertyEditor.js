import { BasePropertyEditor } from "@node-projects/web-component-designer";
import { BindableObjectsBrowser } from "@node-projects/web-component-designer-widgets-wunderbaum";
export class IobrokerSignalPropertyEditor extends BasePropertyEditor {
    _ip;
    constructor(property) {
        super(property);
        let cnt = document.createElement('div');
        cnt.style.display = 'flex';
        this._ip = document.createElement('input');
        this._ip.onchange = (e) => this._valueChanged(this._ip.value);
        this._ip.onfocus = (e) => {
            this._ip.selectionStart = 0;
            this._ip.selectionEnd = this._ip.value?.length;
        };
        cnt.appendChild(this._ip);
        let btn = document.createElement('button');
        btn.textContent = '...';
        btn.onclick = async () => {
            let b = new BindableObjectsBrowser();
            b.initialize(this.designItems[0].serviceContainer);
            b.title = 'select signal...';
            const abortController = new AbortController();
            b.objectDoubleclicked.on(() => {
                abortController.abort();
                this._ip.value = b.selectedObject.fullName;
                this._valueChanged(this._ip.value);
            });
            let res = await window.appShell.openConfirmation(b, 100, 100, 400, 300, null, abortController.signal);
            if (res) {
                this._ip.value = b.selectedObject.fullName;
                this._valueChanged(this._ip.value);
            }
        };
        cnt.appendChild(btn);
        this.element = cnt;
    }
    refreshValue(valueType, value) {
        if (value == null)
            this._ip.value = "";
        else
            this._ip.value = value;
    }
}
