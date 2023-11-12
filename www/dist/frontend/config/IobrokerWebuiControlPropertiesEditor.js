import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
export class IobrokerWebuiControlPropertiesEditor extends BaseCustomWebComponentConstructorAppend {
    static style = css `
    :host {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 30px;
        overflow-y: auto;
        align-content: start;
        height: 100%;
        padding: 5px;
        gap: 2px;
    }
    div {
        font-size: 10px;
    }
    input {
        width: 100%;
        box-sizing: border-box; 
    }`;
    //TODO: enum properties, will be stored like this "'aa'|'bb'" -> like typescript enums
    static template = html `
        <div>name</div>
        <div>type</div>
        <div>def.</div>
        <div></div>
        <template repeat:item="[[this.properties]]">
            <input value="{{item.name}}" @input="[[this.changed()]]">
            <select css:display="[[item.type == 'enum' ? 'none' : '']]" value="{{item.type}}" @change="[[this.changed()]]">
                <option value="string">string</option>
                <option value="boolean">boolean</option>
                <option value="number">number</option>
                <option value="color">color</option>
                <option value="date">date</option>
                <option value="signal">signal</option>
                <option value="screen">screen</option>
            </select>
            <input css:display="[[item.type == 'enum' ? '' : 'none']]" value="{{?item.values}}" @input="[[this.changed()]]">
            <input type="text" value="{{?item.def}}" @input="[[this.changed()]]">
            <button @click="[[this.removeProp(index)]]">del</button>
        </template>
        <button css:display="[[this.properties ? 'block' : 'none']]" style="grid-column-end: span 4;" @click="addProp">add...</button>
        <button css:display="[[this.properties ? 'block' : 'none']]" style="grid-column-end: span 4;" @click="addEnumProp">add enum...</button>`;
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._bindingsParse();
        this._assignEvents();
    }
    properties;
    propertiesObj;
    setProperties(properties) {
        this.propertiesObj = properties;
        if (properties) {
            this.properties = [];
            for (let p in properties) {
                let t = properties[p];
                this.properties.push({ name: p, type: t.type, values: JSON.stringify(t.values), def: t.default });
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
        this.changed();
    }
    changed() {
        if (this.propertiesObj) {
            for (let p in this.propertiesObj) {
                delete this.propertiesObj[p];
            }
        }
        for (let p of this.properties) {
            if (p.name) {
                let obj = { type: p.type };
                if (p.def) {
                    if (p.type == 'number')
                        obj.default = parseFloat(p.def);
                    else if (p.type == 'boolean')
                        obj.default = p.def == 'true';
                    else
                        obj.default = p.def;
                }
                if (p.type == 'enum') {
                    obj.values = JSON.parse(p.values);
                }
                this.propertiesObj[p.name] = obj;
            }
        }
    }
}
customElements.define("iobroker-webui-control-properties-editor", IobrokerWebuiControlPropertiesEditor);
