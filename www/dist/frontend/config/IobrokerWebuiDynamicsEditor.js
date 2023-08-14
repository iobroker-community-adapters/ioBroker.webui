import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import { BindingMode, BindingTarget } from '@node-projects/web-component-designer';
export class IobrokerWebuiDynamicsEditor extends BaseCustomWebComponentConstructorAppend {
    constructor(property, binding, bindingTarget) {
        super();
        this.twoWayPossible = false;
        this.twoWay = false;
        this.complex = false;
        this.formula = '';
        this.objectNames = '';
        this.invert = false;
        this.expression = '';
        super._restoreCachedInititalValues();
        //this._property = property;
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
            this.formula = this._binding.expression;
            this.invert = this._binding.invert;
            if (this._binding.bindableObjectNames)
                this.objectNames = this._binding.bindableObjectNames.join(';');
        }
        this._bindingsParse();
    }
}
IobrokerWebuiDynamicsEditor.template = html `
        <div id="root">
            <div class="vertical-grid">
                <div style="grid-column: 1/3">
                    <div style="display: flex; flex-direction: column;">
                        <div class="row">
                            <span style="cursor: pointer;" title="to use multiple objects, seprate them with semicolon (;)">objects</span>
                        </div>
                        <input class="row" value="{{?this.objectNames::change}}" style="flex-grow: 1;"></input>
                        <select class="row" value="{{thi.objectValueType}}">
                            <option>number</option>
                            <option>boolean</option>
                            <option>string</string>
                        </select>
                        <div class="row">
                            <input type="checkbox" checked="{{this.complex::change}}">
                            <span>complex</span>
                        </div>
                        <div class="row">
                            <input type="checkbox" disabled="[[!this.twoWayPossible]]" checked="{{this.twoWay::change}}">
                            <span>two way binding</span>
                        </div>
                        <div class="row">
                            <input type="checkbox" checked="{{this.invert::change}}">
                            <span>invert logic</span>
                        </div>
                        <div class="row">
                            <span style="cursor: pointer;" title="access multiple objects with @0, @1, ...">formula</span>
                        </div>
                        <div class="row">
                            <input type="text" disabled="[[!this.complex]]" value="{{?this.expression}}" style="width: 100%">
                        </div>
                    </div>
                </div>
            </div>
            <div class="vertical-grid">
                <div>
                    <div class="input-headline">
                        <span>converter</span>:
                    </div>
                    <div>
                        <selecttype="" id="select_converter"></select>
                    </div>
                </div>
                <div class="padding_top controlbox">
                    <button disabled type="button"  value="add">
                        <span>add</span>
                    </button>
                </div>
            </div>
            <div class="vertical-grid">
                <div class="bottomleft">
                    <div style="height: 100%;">
                        
                    </div>
                </div>
                <div class="controlbox" id="grid-controls">
                    <button disabled type="button" id="add-row-button" value="add">
                        <span>Add</span>
                    </button>
                    <button disabled id="remove-row-button" value="remove" style="margin-top: 6px;">
                        <span>remove</span>
                    </button>
                </div>
            </div>
        </div>`;
IobrokerWebuiDynamicsEditor.style = css `
        :host {
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
            gap: 20px;
            height: calc(100% - 40px)
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
IobrokerWebuiDynamicsEditor.is = 'iobroker-webui-dynamics-editor';
IobrokerWebuiDynamicsEditor.properties = {
    twoWayPossible: Boolean,
    twoWay: Boolean,
    complex: Boolean,
    formula: String,
    objectNames: String,
    invert: Boolean,
    expression: String
};
customElements.define(IobrokerWebuiDynamicsEditor.is, IobrokerWebuiDynamicsEditor);
