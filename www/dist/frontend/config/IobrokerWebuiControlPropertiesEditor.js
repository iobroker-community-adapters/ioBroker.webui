import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
export class IobrokerWebuiControlPropertiesEditor extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._bindingsParse();
        this._assignEvents();
    }
    setProperties(properties) {
        this.propertiesObj = properties;
        if (properties) {
            this.properties = [];
            for (let p in properties) {
                this.properties.push({ name: p, type: properties[p] });
            }
        }
        else {
            this.properties = null;
        }
        this._bindingsRefresh();
    }
    refresh() {
        this._bindingsRefresh();
    }
    add() {
        this.properties.push({ name: '', type: 'string' });
        this._bindingsRefresh();
    }
    changed() {
        if (this.propertiesObj) {
            for (let p in this.propertiesObj) {
                delete this.propertiesObj[p];
            }
        }
        for (let p of this.properties) {
            if (p.name) {
                this.propertiesObj[p.name] = p.type;
            }
        }
    }
}
IobrokerWebuiControlPropertiesEditor.style = css `
    :host {
        display: grid;
        grid-template-columns: 1fr 1fr;
        overflow-y: auto;
        align-content: start;
        height: 100%;
        padding: 5px;
        gap: 2px;
    }
    input {
        width: 100%;
        box-sizing: border-box; 
    }`;
//TODO: enum properties, will be stored like this "'aa'|'bb'" -> like typescript enums
IobrokerWebuiControlPropertiesEditor.template = html `
        <template repeat:item="[[this.properties]]">
            <input value="{{item.name}}" @input="[[this.changed()]]">
            <select value="{{item.type}}" @change="[this.changed()]]">
                <option value="string">string</option>
                <option value="boolean">boolean</option>
                <option value="number">number</option>
                <option value="color">color</option>
            </select>
        </template>
        <button css:display="[[this.properties ? 'block' : 'none']]" style="grid-column-end: span 2;" @click="add">add...</button>`;
customElements.define("iobroker-webui-control-properties-editor", IobrokerWebuiControlPropertiesEditor);
