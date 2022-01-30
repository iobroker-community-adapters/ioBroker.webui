import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from "@node-projects/base-custom-webcomponent";
//@ts-ignore
import fancyTreeStyleSheet from "jquery.fancytree/dist/skin-win8/ui.fancytree.css" assert {type: 'css'};

export function getDeepValue(obj: any, path: string): any {
    const parts = path.split('.');
    let val = obj;
    for (let i = 0; i < parts.length; i++) {
        val = val[parts[i]]
    }
    return val;
}

export function setDeepValue(obj: any, path: string, value: any) {
    const parts = path.split('.');
    let val = obj;
    let i;
    for (i = 0; i < parts.length - 1; i++) {
        val = val[parts[i]]
    }
    val[parts[i]] = value;
}

export interface IPropertyInfo {
    name: string;
    type: string;
    nullable: boolean;
    category?: string;
    description?: string
}

export interface IPropertyProvider {
    getProperties(typeName: string, instance: any): Record<string, IPropertyInfo>;
}

interface IPropertyGridFancyTreeItem {
    title?: string;
    icon?: string;
    folder?: boolean;
    expanded?: boolean;
    children?: IPropertyGridFancyTreeItem[];
    nodeType?: string;
    data?: any;
    propertyInfo?: IPropertyInfo,
    propertyPath?: string,
    tooltip?: string
}

export class PropertyGrid extends BaseCustomWebComponentConstructorAppend {
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
            grid-template-rows: auto auto 1fr auto;
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

        thead th, #head {
            position: sticky;
            top: 0;
            left: 1px;
            background: #f0f0f0;
            padding-left: 5px;
        }

        #tableDiv {
            overflow: auto;
            width: 100%;
            height: 100%;
            grid-area: properties;
        }

        table {
            user-select: none;
            overflow: auto;
            width: calc(100% - 1px);
            table-layout: fixed;
        }

        table td {
            overflow: hidden;
        }

        table th {
            overflow: visible;
        }

        table th.resizing {
            cursor: col-resize;
        }

        tr.fancytree-folder {
            background-color: #e6e6e6;
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
    `;

    public static readonly template = html`
        <div id="tableDiv">
            <div id="head"></div>
            <div id="tableDiv">
                <table id="table">
                    <colgroup>
                        <col style="width: 35%;" />
                        <col id="lastCol" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody id="tbody"></tbody>
                </table>
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
    };

    public static readonly is = 'property-grid';

    public propertyProvider: IPropertyProvider;
    public typeName: string;

    public noCategory: boolean;
    public hideProperties: string;
    public expanded: boolean;

    public getSpecialPropertyEditor: (property: IPropertyInfo, currentValue, propertyPath: string, valueChangedCallback: (newValue) => void) => HTMLElement;

    private _selectedObject: any;
    public get selectedObject(): any {
        return this._selectedObject;
    }
    public set selectedObject(value: any) {
        this._selectedObject = value;
        this.updateTree();
    }
    public propertyChanged = new TypedEvent<{ property: string, newValue: any }>();

    private _table: HTMLTableElement;
    private _tree: Fancytree.Fancytree;
    private _head: HTMLDivElement;

    public constructor() {
        super();

        this._parseAttributesToProperties();
        this._table = this._getDomElement<HTMLTableElement>('table');
        this._head = this._getDomElement<HTMLDivElement>('head');
        //new TableColumnResize(this._table);
    }

    public ready(): void {
        $(this._table).fancytree(<Fancytree.FancytreeOptions>{
            icon: false,
            extensions: ['table', 'gridnav'],
            keyboard: false,
            source: [],
            copyFunctionsToData: true,
            renderColumns: (_event, data) => {
                const row = data.node.tr;
                const cell = <HTMLTableCellElement>row.children[1];
                //removeAllChildnodes(cell);
                if (!data.node.folder) {
                    const pPath = <string>data.node.data.propertyPath;
                    const currentValue = getDeepValue(this._selectedObject, pPath);
                    const pInfo = <IPropertyInfo>data.node.data.propertyInfo;
                    const ctl = this._internalGetEditorForType(pInfo, currentValue, pPath);
                    if (ctl) {
                        cell.appendChild(ctl);
                    }
                }
            },
            table: {
                indentation: 20,
                nodeColumnIdx: 0,
                checkboxColumnIdx: 0,
            },
            gridnav: {
                autofocusInput: false,
                handleCursorKeys: true,
            },
            focus: (_event, data) => {
                this.updateDescription(data);
            },
            click: (_event, data) => {
                this.updateDescription(data);
                return true;
            },
        });

        this._tree = $.ui.fancytree.getTree(this._table);
        //resizableTable(this._table);

        if (this.selectedObject) {
            this.updateTree();
        }
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [fancyTreeStyleSheet, this.constructor.style];
    }

    private updateDescription(data: Fancytree.EventData) {
        if (data.node.folder) {
            return;
        }
        this._getDomElement<HTMLElement>('descTitel').innerText = data.node.title;
        if (data.node.tooltip) {
            this._getDomElement<HTMLElement>('descText').innerText = data.node.tooltip;
        } else {
            this._getDomElement<HTMLElement>('descText').innerText = '';
        }
    }

    private createPropertyNodes(baseNode: IPropertyGridFancyTreeItem[], properties: { [index: string]: IPropertyInfo }, prefix = '') {
        if (!this.noCategory) {
            const groups: Map<string, { [index: string]: IPropertyInfo }> = new Map();

            for (const name in properties) {
                const p = properties[name];
                let nm = '';
                if (p.category) {
                    nm = p.category;
                }
                if (!groups.has(nm)) {
                    groups.set(nm, {});
                }
                groups.get(nm)[name] = p;
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
            this.createPropertyNodesInternal(baseNode, properties, prefix);
        }
    }

    private createPropertyNodesInternal(baseNode: IPropertyGridFancyTreeItem[], properties: Record<string, IPropertyInfo>, prefix = '') {
        for (const name in properties) {
            if (!this.hideProperties || (';' + this.hideProperties + ';').indexOf(';' + name + ';') < 0) {
                const p = properties[name];
                /*if (p.BaseType === 'Class' && p.Type !== 'System.Object' && !p.IsIEnumerableT && !p?.PropertyDetails?.PropertyEditorType) {
                    const children = [];
                    baseNode.push({
                        title: name,
                        folder: true,
                        children: children,
                        propertyInfo: p,
                        expanded: this.expanded,
                    });
                    this.createPropertyNodes(children, mccReflection.getClassProperties(p.Type), prefix + name + '.');
                } else*/ {
                    baseNode.push({
                        title: name,
                        folder: false,
                        propertyInfo: p,
                        propertyPath: prefix + name,
                        tooltip: p.description,
                    });
                }
            }
        }
    }

    public wrapEditorWithNullable(inner: HTMLElement, currentValue: any, propertyPath: string): HTMLElement {
        const div = document.createElement('div');
        div.style.display = 'flex';
        const editor = document.createElement('input');
        editor.type = 'checkbox';
        if (currentValue) {
            editor.checked = true;
            //inner.
        }

        editor.onchange = () => {
            if (editor.checked)
                setDeepValue(this._selectedObject, propertyPath, editor.checked);
            else
                setDeepValue(this._selectedObject, propertyPath, null);
        }

        div.appendChild(editor);
        div.appendChild(inner);
        return div;
    }

    private _internalGetEditorForType(property: IPropertyInfo, currentValue: any, propertyPath: string): HTMLElement {
        if (this.getSpecialPropertyEditor) {
            const editor = this.getSpecialPropertyEditor(property, currentValue, propertyPath, (value) => {
                //setDeepValue(this._selectedObject, propertyPath, value);
                this.propertyChanged.emit({ property: propertyPath, newValue: value });
            });
            if (editor) {
                return editor;
            }
        }
        let editor = this.getEditorForType(property.type, currentValue, propertyPath);
        if (property.nullable) {
            editor = this.wrapEditorWithNullable(editor, currentValue, propertyPath);
        }
        return editor;
    }

    private getEditorForType(type: string, currentValue: any, propertyPath: string): HTMLElement {
        let editor;
        switch (type) {
            case 'boolean': {
                editor = document.createElement('input');
                editor.type = 'checkbox';
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.checked);
                };
                break;
            }
            case 'string': {
                editor = document.createElement('input');
                editor.type = 'text';
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                break;
            }
            case 'number': {
                editor = document.createElement('input');
                editor.type = 'number';
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                break;
            }
            case 'color': {
                editor = document.createElement('input');
                editor.type = 'color';
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                break;
            }
            case 'enum': {
                editor = document.createElement('select');
                editor.onchange = () => {
                    setDeepValue(this._selectedObject, propertyPath, editor.value);
                };
                break;
            }
        }

        return editor;
    }

    private updateTree() {
        if (this._tree != null && this._selectedObject != null) {
            if (this._selectedObject.$type) {
                this.typeName = this._selectedObject.$type;
            }
        }

        if (this.selectedObject) {
            this._head.innerText = "testtext";
        }
        else {
            this._head.innerText = '';
        }
        this._renderTree();
    }

    private _renderTree() {
        if (this._tree) {
            this._tree.getRootNode().removeChildren();

            const rootObject: IPropertyGridFancyTreeItem[] = [];

            if (this.typeName) {
                this.createPropertyNodes(rootObject, this.propertyProvider.getProperties(this.typeName, this.selectedObject));
                this._tree.reload(rootObject);
            }
            //resizableTable(this._table);
        }
    }

    public clear() {
        this._tree.getRootNode().removeChildren();
    }
}

window.customElements.define(PropertyGrid.is, PropertyGrid);