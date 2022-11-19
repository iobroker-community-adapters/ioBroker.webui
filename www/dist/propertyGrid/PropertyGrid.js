import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
//@ts-ignore
import fancyTreeStyleSheet from '/webui/node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css' assert { type: 'css' };
export function getDeepValue(obj, path) {
    const parts = path.split('.');
    let val = obj;
    for (let i = 0; i < parts.length; i++) {
        val = val[parts[i]];
    }
    return val;
}
export function setDeepValue(obj, path, value) {
    const parts = path.split('.');
    let val = obj;
    let i;
    for (i = 0; i < parts.length - 1; i++) {
        val = val[parts[i]];
    }
    val[parts[i]] = value;
}
export class PropertyGrid extends BaseCustomWebComponentConstructorAppend {
    static style = css `
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
    static template = html `
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
    static properties = {
        noCategory: Boolean,
        hideProperties: String,
        expanded: Boolean,
    };
    static is = 'property-grid';
    propertyProvider;
    typeName;
    noCategory;
    hideProperties;
    expanded;
    getSpecialPropertyEditor;
    _selectedObject;
    get selectedObject() {
        return this._selectedObject;
    }
    set selectedObject(value) {
        this._selectedObject = value;
        this.updateTree();
    }
    propertyChanged = new TypedEvent();
    _table;
    _tree;
    _head;
    constructor() {
        super();
        this._parseAttributesToProperties();
        this._table = this._getDomElement('table');
        this._head = this._getDomElement('head');
        //new TableColumnResize(this._table);
    }
    ready() {
        $(this._table).fancytree({
            icon: false,
            extensions: ['table', 'gridnav'],
            keyboard: false,
            source: [],
            copyFunctionsToData: true,
            renderColumns: (_event, data) => {
                const row = data.node.tr;
                const cell = row.children[1];
                //removeAllChildnodes(cell);
                if (!data.node.folder) {
                    const pPath = data.node.data.propertyPath;
                    const currentValue = getDeepValue(this._selectedObject, pPath);
                    const pInfo = data.node.data.propertyInfo;
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
    updateDescription(data) {
        if (data.node.folder) {
            return;
        }
        this._getDomElement('descTitel').innerText = data.node.title;
        if (data.node.tooltip) {
            this._getDomElement('descText').innerText = data.node.tooltip;
        }
        else {
            this._getDomElement('descText').innerText = '';
        }
    }
    createPropertyNodes(baseNode, properties, prefix = '') {
        if (!this.noCategory) {
            const groups = new Map();
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
                }
                else {
                    const children = [];
                    baseNode.push({
                        title: '[' + g[0] + ']',
                        folder: true,
                        children: children,
                    });
                    this.createPropertyNodesInternal(children, g[1], prefix);
                }
            }
        }
        else {
            this.createPropertyNodesInternal(baseNode, properties, prefix);
        }
    }
    createPropertyNodesInternal(baseNode, properties, prefix = '') {
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
    wrapEditorWithNullable(inner, currentValue, propertyPath) {
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
        };
        div.appendChild(editor);
        div.appendChild(inner);
        return div;
    }
    _internalGetEditorForType(property, currentValue, propertyPath) {
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
    getEditorForType(type, currentValue, propertyPath) {
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
    updateTree() {
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
    _renderTree() {
        if (this._tree) {
            this._tree.getRootNode().removeChildren();
            const rootObject = [];
            if (this.typeName) {
                this.createPropertyNodes(rootObject, this.propertyProvider.getProperties(this.typeName, this.selectedObject));
                this._tree.reload(rootObject);
            }
            //resizableTable(this._table);
        }
    }
    clear() {
        this._tree.getRootNode().removeChildren();
    }
}
window.customElements.define(PropertyGrid.is, PropertyGrid);
