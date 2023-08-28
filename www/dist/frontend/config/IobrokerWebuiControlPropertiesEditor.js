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
                if (properties[p].startsWith("["))
                    this.properties.push({ name: p, type: 'enum', values: properties[p] });
                else
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
    addProp() {
        this.properties.push({ name: '', type: 'string' });
        this._bindingsRefresh();
    }
    addEnumProp() {
        this.properties.push({ name: '', type: 'enum', values: '["a", "b"]' });
        this._bindingsRefresh();
    }
    removeProp(index) {
        this.properties.splice(index, 1);
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
                if (p.type != 'enum')
                    this.propertiesObj[p.name] = p.type;
                else {
                    if (p.values)
                        this.propertiesObj[p.name] = p.values;
                }
            }
        }
    }
}
IobrokerWebuiControlPropertiesEditor.style = css `
    :host {
        display: grid;
        grid-template-columns: 1fr 1fr 30px;
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
            <select css:display="[[item.type == 'enum' ? 'none' : '']]" value="{{item.type}}" @change="[[this.changed()]]">
                <option value="string">string</option>
                <option value="boolean">boolean</option>
                <option value="number">number</option>
                <option value="color">color</option>
                <option value="date">date</option>
            </select>
            <input css:display="[[item.type == 'enum' ? '' : 'none']]" value="{{?item.values}}" @input="[[this.changed()]]">
            <button @click="[[this.removeProp(index)]]">del</button>
        </template>
        <button css:display="[[this.properties ? 'block' : 'none']]" style="grid-column-end: span 3;" @click="addProp">add...</button>
        <button css:display="[[this.properties ? 'block' : 'none']]" style="grid-column-end: span 3;" @click="addEnumProp">add enum...</button>`;
customElements.define("iobroker-webui-control-properties-editor", IobrokerWebuiControlPropertiesEditor);
