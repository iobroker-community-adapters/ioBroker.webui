import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import { BindingMode, BindingTarget, IBinding, IProperty } from '@node-projects/web-component-designer';
import { BindableObjectsBrowser } from "@node-projects/web-component-designer-widgets-wunderbaum";

export class IobrokerWebuiDynamicsEditor extends BaseCustomWebComponentConstructorAppend {

    static readonly template = html`
        <div id="root">
            <div class="vertical-grid">
                <div style="grid-column: 1/3">
                    <div style="display: flex; flex-direction: column;">
                        <div class="row">
                            <span style="cursor: pointer;" title="to use multiple objects, seprate them with semicolon (;). access iobroker objects in properties via ?propertyName, access the propertyValue via ??propertyName">objects</span>
                        </div>
                        <div style="display:flex;align-items: flex-end;">
                            <input class="row" value="{{?this.objectNames::change}}" style="flex-grow: 1;">
                            <button @click="_clear" style="height: 22px">X</button>
                            <button @click="_select" style="height: 22px">...</button>
                        </div>
                        <div class="row">
                            <label style="white-space: nowrap; margin-right: 4px;" title="if set, the value is converted to the type before binding is applied">type :</label>
                            <select class="row" value="{{?this.objectValueType}}">
                                <option selected value="">ignore</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                                <option value="string">string</string>
                            </select>
                        </div>
                        <div class="row">
                            <input type="checkbox" disabled="[[!this.twoWayPossible]]" checked="{{this.twoWay::change}}" @change="_refresh">
                            <span>two way binding</span>
                            <span style="margin-left: 15px">events:&nbsp;</span>
                            <input title="to use multiple events, seprate them with semicolon (;)" class="row" disabled="[[!this.twoWay]]" value="{{?this.events::change}}" style="flex-grow: 1; margin-right: 10px;">
                        </div>
                        <div class="row">
                            <input type="checkbox" checked="{{this.invert::change}}">
                            <span>invert logic</span>
                        </div>
                        <div class="row">
                            <span style="cursor: pointer;" title="javascript expression. access objects with __0, __1, ...">formula</span>
                        </div>
                        <div class="row">
                            <input type="text" value="{{?this.expression}}" style="width: 100%">
                        </div>
                    </div>
                </div>
            </div>
            <div class="vertical-grid" style="margin-top: 10px;">
                <div>
                    <div class="input-headline">
                        <span>converter</span>:
                    </div>
                </div>
            </div>
            <div class="vertical-grid" style="border: solid 1px black; padding: 10px; overflow-y: auto;">
                <div class="bottomleft">
                    <div id="converterGrid" style="height: 100%;">
                        <div style="width: 100%; height: 20px; display: flex;">
                            <div style="width: 39%">condition</div>
                            <div style="width: 59%">value</div>
                        </div>
                        <template repeat:item="[[this.converters]]">
                            <div css:background-color="[[item.activeRow ? 'gray' : '']]" style="width: 100%; display: flex; height: 26px; justify-content: center; align-items: center; gap: 5px;">
                                <input type="text" value="{{item.key}}" @focus="[[this._focusRow(index)]]" style="width: 39%">
                                <input type="[[this._property.type == 'color' ? 'color' : 'text']]" value="{{item.value}}" @focus="[[this._focusRow(index)]]" style="width: 59%">
                            </div>
                        </template>
                    </div>
                </div>
                <div class="controlbox" id="grid-controls">
                    <button type="button" id="add-row-button" value="add" @click="addConverter">
                        <span>add</span>
                    </button>
                    <button id="remove-row-button" value="remove" style="margin-top: 6px;" @click="removeConverter">
                        <span>remove</span>
                    </button>
                </div>
            </div>
        </div>`;

    static readonly style = css`
        :host {
            box-sizing: border-box;
        }
        
        #converterGrid {
            display: flex;
            gap: 2px;
            flex-direction: column;
        }
        #converterGrid input {
            height: 20px;
            box-sizing: border-box;
        }

        .padding_top {
            padding-top: 30px;
        }

        .row{
            margin-top: 3px;
            display: flex;
            align-items: center;
        }

        .controlbox {
            display: flex;
            flex-direction: column;
        }

        .input-headline {
            height: 30px;
        }

        input[type="checkbox"] {
            margin-right: 15px;
            width: 15px;
            height: 15px;
        }

        select {
            width: 100%;
        }

        #root {
            padding: 2px 10px;
            display: grid;
            grid-template-rows: min-content min-content;
            overflow: auto;
            height: calc(100% - 4px)
        }

        .vertical-grid {
            display: grid;
            grid-template-columns: calc((100% - 150px) - 30px) 150px;
            gap: 30px;
        }

        #grid input, #list input { 
            border:0px;
        }

        #tagdata_type {
            height: 24px;
            font-size: inherit;
        }`;

    static readonly is = 'iobroker-webui-dynamics-editor';

    static readonly properties = {
        twoWayPossible: Boolean,
        twoWay: Boolean,
        expression: String,
        objectNames: String,
        events: String,
        invert: Boolean,
        converters: Array
    }

    public twoWayPossible: boolean = false;
    public twoWay: boolean = false;
    public expression: string = '';
    public objectNames: string = '';
    public events: string = '';
    public invert: boolean = false;
    public converters: { key: string, value: any }[] = [];
    public objectValueType: string;

    _property: IProperty;
    private _binding: IBinding & { converter: Record<string, any> };
    private _bindingTarget: BindingTarget;
    private _activeRow: number = -1;

    constructor(property: IProperty, binding: IBinding & { converter: Record<string, any> }, bindingTarget: BindingTarget) {
        super();
        super._restoreCachedInititalValues();

        this._property = property;
        this._binding = binding;
        this._bindingTarget = bindingTarget;
    }

    ready() {
        this._parseAttributesToProperties();
        this._assignEvents();

        this.twoWayPossible = false;
        if (this._bindingTarget == BindingTarget.property)
            this.twoWayPossible = true;

        if (this._binding) {
            this.twoWay = this._binding.mode == BindingMode.twoWay;
            this.expression = this._binding.expression;
            this.invert = this._binding.invert;
            this.objectValueType = this._binding.type;
            if (this._binding.bindableObjectNames)
                this.objectNames = this._binding.bindableObjectNames.join(';');
            if (this._binding.converter) {
                for (let c in this._binding.converter) {
                    this.converters.push({ key: c, value: this._binding.converter[c] });
                }
            }
            if (this._binding.changedEvents && this._binding.changedEvents.length)
                this.events = this._binding.changedEvents.join(';');
        }

        this._bindingsParse();
    }

    _focusRow(index: number) {
        this._activeRow = index;
        this._updatefocusedRow();
    }

    _updatefocusedRow() {
        let g = this._getDomElement('converterGrid');
        g.querySelectorAll('div').forEach(x => x.style.background = '');
        if (this._activeRow >= 0)
            (<HTMLDivElement>g.children[this._activeRow + 1]).style.background = 'gray';
    }

    _clear() {
        this.objectNames = '';
        this._bindingsRefresh();
    }

    _refresh() {
        requestAnimationFrame(() => {
            this._bindingsRefresh();
        });
    }

    async _select() {
        let b = new BindableObjectsBrowser();
        b.initialize(window.appShell.serviceContainer);
        b.title = 'select signal...';
        const abortController = new AbortController();
        b.objectDoubleclicked.on(() => {
            abortController.abort();
            if (this.objectNames != '')
                this.objectNames += ';'
            this.objectNames += b.selectedObject.fullName;
            this._bindingsRefresh();
        });
        let res = await window.appShell.openConfirmation(b, 100, 100, 400, 300, this, abortController.signal);
        if (res) {
            if (this.objectNames != '')
                this.objectNames += ';'
            this.objectNames += b.selectedObject.fullName;
            this._bindingsRefresh();
        }
    }

    addConverter() {
        this.converters.push({ key: '', value: '' });
        this._activeRow = this.converters.length - 1;
        this._bindingsRefresh();
        this._updatefocusedRow();
    }


    removeConverter() {
        this.converters.splice(this._activeRow, 1);
        this._activeRow = -1;
        this._bindingsRefresh();
        this._updatefocusedRow();
    }
}
customElements.define(IobrokerWebuiDynamicsEditor.is, IobrokerWebuiDynamicsEditor)