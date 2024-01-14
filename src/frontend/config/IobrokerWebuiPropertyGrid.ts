import { BaseCustomWebComponentConstructorAppend, TypedEvent, css, html } from "@node-projects/base-custom-webcomponent";
import { CodeViewMonaco } from "@node-projects/web-component-designer-codeview-monaco";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { BindableObjectsBrowser, defaultOptions } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from 'wunderbaum';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' assert { type: 'css' };
import { WunderbaumNode } from "wb_node";
import { WbNodeData, WbRenderEventType } from "types";
import { IUiCommand } from "@node-projects/web-component-designer";

export interface ITypeInfo {
    properties?: IProperty[];
    name?: string;

}
export interface IProperty {
    category?: string;
    name?: string;
    type?: 'object' | 'string' | 'number' | 'boolean' | 'color' | 'enum' | 'any';
    values?: string[]; //on a enum type
    description?: string;
    defaultValue?: string;
    nullable?: boolean;
    format?: string;
}

interface IPropertyGridFancyTreeItem extends WbNodeData {
    property?: IProperty;
    propertyPath?: string;
}

let nullObject: {};
export function deepValue(obj, path: string, returnNullObject = false) {
    if (path === undefined || path === null) {
        return obj;
    }

    const pathParts = path.split('.');
    for (let i = 0; i < pathParts.length; i++) {
        if (obj != null) {
            obj = obj[pathParts[i]];
        } else {
            return returnNullObject ? nullObject : null;
        }
    }
    return obj;
}

export function setDeepValue(obj, path: string, value) {
    if (path === undefined || path === null) {
        return;
    }

    const pathParts = path.split('.');
    for (let i = 0; i < pathParts.length - 1; i++) {
        if (obj != null) {
            let newObj = obj[pathParts[i]];
            if (newObj == null) {
                newObj = {};
                obj[pathParts[i]] = newObj;
            }
            obj = newObj;
        }
    }

    if (obj != null) {
        if (value === undefined)
            delete obj[pathParts[pathParts.length - 1]]
        else
            obj[pathParts[pathParts.length - 1]] = value;
    }
}

export function typeInfoFromJsonSchema(jsonSchemaObj: any, obj: any, type: string): ITypeInfo {
    let usedType = type ?? obj.type;
    if (usedType) {
        const def = jsonSchemaObj.definitions[usedType];
        let tInfo: ITypeInfo = {};
        tInfo.name = usedType;
        tInfo.properties = [];
        let lst = Object.keys(def.properties);
        if (def.propertyOrder)
            lst = def.propertyOrder;
        for (let prp of lst) {
            if (prp != 'type') {
                let p: IProperty = {};
                p.name = prp;
                p.type = def.properties[prp].type ?? 'any';
                if (def.properties[prp].enum) {
                    p.type = 'enum';
                    p.values = [...def.properties[prp].enum];
                }
                p.description = def.properties[prp].description;
                p.format = def.properties[prp].format;
                tInfo.properties.push(p);
            }
        }
        return tInfo;
    }
    return null;
}

export class IobrokerWebuiPropertyGrid extends BaseCustomWebComponentConstructorAppend {
    public static readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        #tableDiv {
            height: 100%;
            display: grid;
            overflow: auto;
            grid-template-rows: auto 1fr auto auto;
            grid-template-areas:
                'head'
                'properties'
                '.'
                'description';
        }

        .input-group {
            display: flex;
            align-items: center;
        }

        .form-control {
            width: 100%;
            box-sizing: border-box;
            min-height: unset;
            height: 21px;
        }

        #clear {
            height: 11px;
        }

        #head {
            border-bottom: 1px lightgray solid;
            grid-area: head;
            font-size: 10pt;
            overflow: hidden;
        }

        thead th,
        #head {
            position: sticky;
            top: 0;
            left: 1px;
            background: #f0f0f0;
            padding-left: 5px;
        }

        #tableInnerDiv {
            overflow: auto;
            width: 100%;
            height: 100%;
            grid-area: properties;
        }

        #table {
            user-select: none;
            overflow: auto;
            width: calc(100% - 1px);
            table-layout: fixed;
        }

        #lastCol {
            width: 100%;
        }

        #description {
            font-family: tahoma, arial, helvetica;
            font-size: 10pt;
            padding: 5px;
            grid-area: description;
            background-color: #e6e6e6;
        }

        #descText {
            white-space: break-spaces;
        }

        span.fancytree-node {
            white-space: nowrap;
        }
        
        textarea {
            resize: none;
        }`;

    public static readonly template = html` 
        <div id="tableDiv">
            <div id="head"></div>
            <div id="tableInnerDiv">
                <div id="table"></div>
            </div>

            <div id="description">
                <h4 id="descTitel"></h4>
                <p id="descText"></p>
            </div>
        </div>`;

    public static readonly properties = {
        noCategory: Boolean,
        hideProperties: String,
        expanded: Boolean,
        selectedObject: Object,
        getTypeInfo: Function
    };

    public noCategory: boolean;
    public hideProperties: string;
    public expanded: boolean;
    public showHead: boolean;

    public propertyNodeContextMenu = new TypedEvent<{ event: MouseEvent, property: IProperty, propertyPath: string, value: any }>;

    public getTypeInfo: (obj: any, type: string) => ITypeInfo;

    private _table: HTMLDivElement;
    private _tree: Wunderbaum;
    private _head: HTMLDivElement;

    public constructor() {
        super();
        this._restoreCachedInititalValues();

        this._table = this._getDomElement<HTMLDivElement>('table');
        this._head = this._getDomElement<HTMLDivElement>('head');
    }

    public ready(): void {
        this._parseAttributesToProperties();

        this._tree = new Wunderbaum({
            ...defaultOptions,
            element: this._table,
            icon: false,
            source: [],
            render: async e => {
                if (e.isNew) {
                    const node = e.node;
                    if (!node.children) {
                        const valueCol = e.renderColInfosById['value'];
                        const pPath = <string>node.data.propertyPath;
                        const currentValue = deepValue(this._selectedObject, pPath);
                        const pInfo = <IProperty>node.data.property;
                        const ctl = await this.getEditorForType(pInfo, currentValue, pPath, e);
                        if (ctl) {
                            if (pInfo.defaultValue && (ctl as HTMLInputElement).value == '' && !pInfo.nullable) {
                                (ctl as HTMLInputElement).placeholder = pInfo.defaultValue;
                            }
                            ctl.style.flexGrow = '1';
                            ctl.style.width = '100%';
                            valueCol.elem.style.display = 'flex';
                            valueCol.elem.appendChild(ctl);
                        }

                        const mainCol = e.allColInfosById['*'];
                        mainCol.elem.title = mainCol.elem.innerText;
                        mainCol.elem.oncontextmenu = (e) => {
                            e.preventDefault();
                            const pPath = <string>node.data.propertyPath;
                            const currentValue = deepValue(this._selectedObject, pPath);
                            const pInfo = <IProperty>node.data.property;
                            this.propertyNodeContextMenu.emit({ event: e, property: pInfo, propertyPath: pPath, value: currentValue });
                        }
                    }
                }
            },
            columns: [
                { id: "*", title: "name", width: "*" },
                { id: "value", title: "value", width: "*" },
            ],
            click: (e) => {
                this.updateDescription(e.node);
                return true;
            },
            init: (e) => {
                if (this.expanded)
                    this._tree.root.expandAll(true);
            }
        });

        if (this.selectedObject) {
            this.updateTree();
        }

        this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, IobrokerWebuiPropertyGrid.style];
    }

    private updateDescription(data: WunderbaumNode) {
        if (data?.data?.folder) {
            return;
        }
        this._getDomElement<HTMLElement>('descTitel').innerText = data?.title ?? '';
        if (data?.data?.property?.description && data?.data?.property?.defaultValue) {
            this._getDomElement<HTMLElement>('descText').innerHTML = data.data.property.description + '<br />Default Value: ' + data.data.property.defaultValue;
        } else if (data?.data?.property?.description) {
            this._getDomElement<HTMLElement>('descText').innerText = data.data.property.description;
        } else if (data?.data.property.defaultValue) {
            this._getDomElement<HTMLElement>('descText').innerText = 'Default Value: ' + data.data.property.defaultValue;
        } else {
            this._getDomElement<HTMLElement>('descText').innerText = '';
        }
    }

    private _selectedObject: any;

    public get selectedObject(): any {
        return this._selectedObject;
    }
    public set selectedObject(value: any) {
        this._selectedObject = value;
        this.updateTree();
    }

    public propertyChanged = new TypedEvent<{ property: string; newValue: any }>();

    public typeName: string;

    private createPropertyNodes(baseNode: IPropertyGridFancyTreeItem[], properties: IProperty[], prefix = '') {
        if (!this.noCategory) {
            const groups: Map<string, { [index: string]: IProperty }> = new Map();

            for (const p of properties) {
                let nm = '';
                if (p.category) {
                    nm = p.category;
                }
                if (!groups.has(nm)) {
                    groups.set(nm, {});
                }
                groups.get(nm)[p.name] = p;
            }

            for (const g of groups) {
                if (g[0] == '') {
                    this.createPropertyNodesInternal(baseNode, g[1], prefix);
                } else {
                    const children = [];
                    baseNode.push({
                        title: '[' + g[0] + ']',
                        folder: true,
                        children: children,
                    });
                    this.createPropertyNodesInternal(children, g[1], prefix);
                }
            }
        } else {
            //@ts-ignore
            this.createPropertyNodesInternal(baseNode, properties.reduce((obj, cur) => ({ ...obj, [cur.name]: cur }), {}), prefix);
        }
    }

    private createPropertyNodesInternal(baseNode: IPropertyGridFancyTreeItem[], properties: { [index: string]: IProperty }, prefix = '') {
        for (const name in properties) {
            if ((!this.hideProperties || (';' + this.hideProperties + ';').indexOf(';' + name + ';') < 0)) {
                const p = properties[name];
                if (p.type === 'object') {
                    const children = [];
                    baseNode.push({
                        title: name,
                        //folder: true,
                        children: children,
                        property: p,
                        expanded: this.expanded,
                    });
                    this.createPropertyNodes(children, this.getTypeInfo(null, p.type).properties, prefix + name + '.');
                } else {
                    baseNode.push({
                        title: name,
                        //folder: false,
                        property: p,
                        propertyPath: prefix + name
                    });
                }
            }
        }
    }

    public setPropertyValue(propertyPath: string, value: any) {
        setDeepValue(this._selectedObject, propertyPath, value);
        this.propertyChanged.emit({ property: propertyPath, newValue: value });
    }

    public getSpecialEditorForType: (property: IProperty, currentValue, propertyPath: string, wbRender: WbRenderEventType, additionalInfo?: any) => Promise<HTMLElement | null>

    public async getEditorForType(property: IProperty, currentValue, propertyPath: string, wbRender: WbRenderEventType, additionalInfo?: any): Promise<HTMLElement> {
        if (this.getSpecialEditorForType) {
            let edt = await this.getSpecialEditorForType(property, currentValue, propertyPath, wbRender, additionalInfo);
            if (edt)
                return edt;
        }
        switch (property.format) {
            case 'screen': {
                let editor = document.createElement('select');
                editor.style.width = '100%';
                for (let v of await iobrokerHandler.getAllNames('screen')) {
                    const op = document.createElement('option');
                    op.value = v;
                    op.innerText = v;
                    editor.appendChild(op);
                }
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                editor.value = currentValue;
                return editor;
            }
            case 'signal': {
                let cnt = document.createElement('div');
                cnt.style.display = 'flex';
                let inp = document.createElement('input');
                inp.value = currentValue ?? '';
                inp.style.flexGrow = '1';
                inp.style.width = '0';
                inp.onchange = (e) => this.setPropertyValue(propertyPath, inp.value);
                inp.onfocus = (e) => {
                    inp.selectionStart = 0;
                    inp.selectionEnd = inp.value?.length;
                }
                cnt.appendChild(inp);
                let btn = document.createElement('button');
                btn.textContent = '...';
                btn.onclick = async () => {
                    let b = new BindableObjectsBrowser();
                    b.initialize(window.appShell.serviceContainer);
                    b.title = 'select signal...';
                    const abortController = new AbortController();
                    b.objectDoubleclicked.on(() => {
                        abortController.abort();
                        inp.value = b.selectedObject.fullName;
                        this.setPropertyValue(propertyPath, inp.value);
                    });
                    let res = await window.appShell.openConfirmation(b, 100, 100, 400, 300, this, abortController.signal);
                    if (res) {
                        inp.value = b.selectedObject.fullName;
                        this.setPropertyValue(propertyPath, inp.value);
                    }
                }
                cnt.appendChild(btn);
                return cnt;

            }
            case 'html':
            case 'script': {
                let editor = document.createElement('div');
                editor.style.boxSizing = 'border-box';
                editor.style.width = '100%';
                editor.style.display = 'flex';

                let inp = document.createElement('textarea');
                inp.style.boxSizing = 'border-box';
                inp.value = currentValue ?? '';
                inp.style.width = '100%';
                inp.onblur = e => { this.setPropertyValue(propertyPath, inp.value); }
                editor.appendChild(inp);

                let btn = document.createElement('button');
                btn.innerHTML = '...';
                btn.style.boxSizing = 'border-box';
                btn.onclick = async () => {
                    let cvm = new CodeViewMonaco();
                    if (property.format == 'html') {
                        cvm.language = 'html';
                    } else {
                        let monacoInfo = {
                            content: `declare global {
                            var context: { event: Event, element: Element };
                        }`, filePath: 'global.d.ts'
                        }
                        //@ts-ignore
                        monaco.languages.typescript.typescriptDefaults.setExtraLibs([monacoInfo]);
                        cvm.language = 'javascript';
                    }
                    cvm.code = inp.value;
                    cvm.style.position = 'relative';
                    let res = await window.appShell.openConfirmation(cvm, 200, 200, 600, 400, this);
                    if (res) {
                        inp.value = cvm.getText();
                        this.setPropertyValue(propertyPath, inp.value);
                    }
                }
                editor.appendChild(btn);

                return editor;
            }
        }
        switch (property.type) {
            case 'any': {
                let editor = document.createElement('div');
                editor.style.display = 'flex';
                let sel = document.createElement('select');

                const op0 = document.createElement('option');
                op0.value = 'null';
                op0.textContent = 'null';
                sel.appendChild(op0);
                const op1 = document.createElement('option');
                op1.value = 'string';
                op1.textContent = 'string';
                sel.appendChild(op1);
                const op2 = document.createElement('option');
                op2.value = 'number';
                op2.textContent = 'number';
                sel.appendChild(op2);
                const op3 = document.createElement('option');
                op3.value = 'boolean';
                op3.textContent = 'boolean';
                sel.appendChild(op3);
                editor.appendChild(sel);

                let stringEditor = document.createElement('input');
                stringEditor.style.display = 'none';
                stringEditor.style.boxSizing = 'border-box';
                stringEditor.style.width = '100%';
                stringEditor.value = currentValue ?? '';
                stringEditor.onblur = e => { this.setPropertyValue(propertyPath, stringEditor.value); }
                editor.appendChild(stringEditor);

                let boolEditor = document.createElement('input');
                boolEditor.style.display = 'none';
                boolEditor.type = 'checkbox'
                boolEditor.checked = currentValue ?? false;
                boolEditor.onblur = e => { this.setPropertyValue(propertyPath, boolEditor.checked); }
                editor.appendChild(boolEditor);

                let numberEditor = document.createElement('input');
                numberEditor.style.display = 'none';
                numberEditor.type = 'number'
                numberEditor.style.boxSizing = 'border-box';
                numberEditor.style.width = '100%';
                numberEditor.value = currentValue ?? '';
                numberEditor.onblur = e => { this.setPropertyValue(propertyPath, numberEditor.valueAsNumber); }
                editor.appendChild(numberEditor);

                let showEdt = () => {
                    stringEditor.style.display = 'none';
                    boolEditor.style.display = 'none';
                    numberEditor.style.display = 'none';
                    if (sel.value == 'string') {
                        stringEditor.style.display = 'block';
                        this.setPropertyValue(propertyPath, stringEditor.value);
                    }
                    else if (sel.value == 'boolean') {
                        boolEditor.style.display = 'block';
                        this.setPropertyValue(propertyPath, boolEditor.checked);
                    }
                    else if (sel.value == 'number') {
                        numberEditor.style.display = 'block';
                        this.setPropertyValue(propertyPath, numberEditor.valueAsNumber);
                    }
                };

                sel.onchange = () => {
                    if (sel.value == 'null')
                        this.setPropertyValue(propertyPath, null);
                    showEdt();
                };

                if (typeof currentValue === 'string')
                    sel.value = 'string';
                else if (typeof currentValue === 'boolean')
                    sel.value = 'boolean';
                else if (typeof currentValue === 'number')
                    sel.value = 'number';
                showEdt();

                return editor;
            }
            case 'string': {
                let editor = document.createElement('input');
                editor.style.boxSizing = 'border-box';
                editor.style.width = '100%';
                editor.value = currentValue ?? '';
                editor.onblur = e => { this.setPropertyValue(propertyPath, editor.value); }
                editor.onkeyup = e => { if (e.key == 'Enter') this.setPropertyValue(propertyPath, editor.value); }
                return editor;
            }
            case 'number': {
                let editor = document.createElement('input');
                editor.type = 'number'
                editor.style.boxSizing = 'border-box';
                editor.style.width = '100%';
                editor.value = currentValue ?? '';
                editor.onblur = e => { this.setPropertyValue(propertyPath, editor.valueAsNumber); }
                editor.onkeyup = e => { if (e.key == 'Enter') this.setPropertyValue(propertyPath, editor.value); }
                return editor;
            }
            case 'boolean': {
                let editor = document.createElement('input');
                editor.type = 'checkbox'
                editor.checked = currentValue ?? false;
                editor.onblur = e => { this.setPropertyValue(propertyPath, editor.checked); }
                return editor;
            }
            case 'color': {
                let editor = document.createElement('input');
                editor.type = 'color';
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                return editor;
            }
            case 'enum': {
                let editor = document.createElement('select');
                editor.style.width = '100%';
                for (let v of property.values) {
                    const op = document.createElement('option');
                    op.value = v;
                    op.innerText = v;
                    editor.appendChild(op);
                }
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                editor.value = currentValue;
                return editor;
            }
        }
        return null;
    }

    public refresh() {
        this.updateTree();
    }

    private updateTree() {
        if (this._head) {
            if (this._selectedObject != null) {
                if (this._selectedObject.$type) {
                    this.typeName = this._selectedObject.$type;
                }
            }
            if (this.selectedObject) {
                let tInfo = this.getTypeInfo(this.selectedObject, this.typeName);
                this._head.innerText = tInfo.name;
                this._renderTree();
            } else {
                this._head.innerText = '';
                this.clear();
            }
            this._head.style.display = this.showHead ? 'block' : 'none';
        }
    }

    private _renderTree() {
        if (this._tree) {
            this._tree.root.removeChildren();

            const rootObject: IPropertyGridFancyTreeItem[] = [];

            this.createPropertyNodes(rootObject, this.getTypeInfo(this.selectedObject, this.typeName).properties);
            this._tree.addChildren(rootObject);
        }
    }

    public clear() {
        this._tree.root.removeChildren();
    }

    saveCallback: (data: any) => void;
    async executeCommand(command: Omit<IUiCommand, 'type'> & { type: string }) {
        if (command.type == 'save') {
            this.saveCallback(this.selectedObject)
        }
    }

    canExecuteCommand(command: Omit<IUiCommand, 'type'> & { type: string }): boolean {
        if (command.type == 'save')
            return this.saveCallback != null;
        return false;
    }
}
customElements.define("iobroker-webui-property-grid", IobrokerWebuiPropertyGrid);