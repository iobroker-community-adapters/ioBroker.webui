import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent"

const notAllowedChars = '!"§$%&/()=?`´-:.,;<>|\\\'#+*°^';

export class IobrokerWebuiControlPropertiesEditor extends BaseCustomWebComponentConstructorAppend {

    static override style = css`
    :host {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 15px 30px 10px 10px;
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
    }
    button {
        padding: 0;
    }`

    //TODO: enum properties, will be stored like this "'aa'|'bb'" -> like typescript enums
    static override template = html`
        <div>name</div>
        <div>type</div>
        <div title="default">def.</div>
        <div title="internal">int</div>
        <div></div>
        <div></div>
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
                <option value="object">object</option>
            </select>
            <input css:display="[[item.type == 'enum' ? '' : 'none']]" value="{{?item.values}}" @input="[[this.changed()]]">
            <input title="default" type="text" value="{{?item.def}}" @input="[[this.changed()]]">
            <input style="margin:0" title="internal" type="checkbox" checked="{{?item.internal::change}}" @change="[[this.changed()]]">
            <button @click="[[this.removeProp(index)]]">del</button>
            <button @click="[[this.up(index)]]">↑</button>
            <button @click="[[this.down(index)]]">↓</button>
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

    public properties: { name: string, type: string, def?: string, values?: string, internal?: boolean }[];
    public propertiesObj: Record<string, { type: string, values?: string[], default?: any, internal?: boolean }>
    public defaultInternal: boolean;

    public setProperties(properties: Record<string, { type: string, values?: string[], default?: any, internal?: boolean }>) {
        this.propertiesObj = properties;
        if (properties) {
            this.properties = [];
            for (let p in properties) {
                let t = properties[p];
                this.properties.push({ name: p, type: t.type, values: JSON.stringify(t.values), def: t.default, internal: t.internal });
            }
        } else {
            this.properties = null;
        }
        this._bindingsRefresh();
    }

    public refresh() {
        this._bindingsRefresh();
    }

    public addProp() {
        let p: { name: string, type: string, internal?: boolean } = { name: '', type: 'string' };
        if (this.defaultInternal)
            p.internal = true;
        this.properties.push(p);
        this._bindingsRefresh();
    }

    public addEnumProp() {
        this.properties.push({ name: '', type: 'enum', values: '["a", "b"]' });
        this._bindingsRefresh();
    }

    public removeProp(index: number) {
        this.properties.splice(index, 1);
        this._bindingsRefresh();
        this.changed();
    }

    public up(index: number) {
        if (index > 0) {
            const element = this.properties[index];
            this.properties.splice(index, 1);
            this.properties.splice(--index, 0, element);
            this._bindingsRefresh();
            this.changed();
        }
    }

    public down(index: number) {
        if (index < this.properties.length - 1) {
            const element = this.properties[index];
            this.properties.splice(index, 1);
            this.properties.splice(++index, 0, element);
            this._bindingsRefresh();
            this.changed();
        }
    }

    public changed() {
        if (this.propertiesObj) {
            for (let p in this.propertiesObj) {
                delete this.propertiesObj[p];
            }
        }
        for (let p of this.properties) {
            if (p.name) {
                for (let c of notAllowedChars)
                    p.name = p.name.replaceAll(c, "");
                p.name = p.name[0].toLowerCase() + p.name.substring(1);

                let obj: { type: string, values?: string[], default?: any, internal?: boolean } = { type: p.type };
                if (p.def) {
                    if (p.type == 'number')
                        obj.default = parseFloat(p.def);
                    else if (p.type == 'boolean')
                        obj.default = p.def == 'true';
                    else
                        obj.default = p.def;
                }
                if (p.internal)
                    obj.internal = true;
                if (p.type == 'enum') {
                    obj.values = JSON.parse(p.values);
                }
                this.propertiesObj[p.name] = obj;
            }
        }
    }
}

customElements.define("iobroker-webui-control-properties-editor", IobrokerWebuiControlPropertiesEditor);