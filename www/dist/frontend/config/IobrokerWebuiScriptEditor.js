import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import scriptCommandsTypeInfo from "../generated/ScriptCommands.json" assert { type: 'json' };
import propertiesTypeInfo from "../generated/Properties.json" assert { type: 'json' };
//@ts-ignore
import fancyTreeStyleSheet from "jquery.fancytree/dist/skin-win8/ui.fancytree.css" assert { type: 'css' };
import { ContextMenu } from "@node-projects/web-component-designer";
import { IobrokerWebuiPropertyGrid, typeInfoFromJsonSchema } from "./IobrokerWebuiPropertyGrid.js";
export class IobrokerWebuiScriptEditor extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._commandListDiv = this._getDomElement('commandList');
        this._possibleCommands = this._getDomElement('possibleCommands');
        this._propertygrid = this._getDomElement('propertygrid');
        this.addPossibleCommands();
        this.shadowRoot.adoptedStyleSheets = [fancyTreeStyleSheet, IobrokerWebuiScriptEditor.style];
    }
    async ready() {
        this._parseAttributesToProperties();
        this._bindingsParse(null, true);
        this._assignEvents();
        let editComplex = async (data) => {
            let pg = new IobrokerWebuiPropertyGrid();
            pg.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
            pg.typeName = 'IScriptMultiplexValue';
            if (typeof data.value === 'object')
                pg.selectedObject = data.value ?? {};
            else
                pg.selectedObject = {};
            let res = await window.appShell.openConfirmation(pg, 100, 100, 300, 300, this);
            if (res) {
                this._propertygrid.setPropertyValue(data.propertyPath, pg.selectedObject);
                this._propertygrid.refresh();
            }
        };
        this._propertygrid.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(scriptCommandsTypeInfo, obj, type);
        this._propertygrid.getSpecialEditorForType = async (property, currentValue, propertyPath) => {
            if (typeof currentValue === 'object') {
                let d = document.createElement('div');
                d.style.display = 'flex';
                let sp = document.createElement('span');
                sp.innerText = 'complex: ' + JSON.stringify(currentValue);
                sp.style.overflow = 'hidden';
                sp.style.whiteSpace = 'nowrap';
                sp.style.textOverflow = 'ellipsis';
                sp.style.flexGrow = '1';
                sp.title = JSON.stringify(currentValue);
                d.appendChild(sp);
                let b = document.createElement('button');
                b.innerText = '...';
                b.onclick = () => {
                    editComplex({ value: currentValue, propertyPath });
                };
                d.appendChild(b);
                return d;
            }
            return null;
        };
        this._propertygrid.propertyNodeContextMenu.on((data) => {
            ContextMenu.show([{
                    title: 'edit complex value',
                    action: async () => {
                        editComplex(data);
                    }
                },
                {
                    title: 'remove complex value',
                    action: async () => {
                        this._propertygrid.setPropertyValue(data.propertyPath, undefined);
                        this._propertygrid.refresh();
                    }
                }], data.event);
        });
    }
    //Converter from TypscriptJsonSchema to our Property list...
    async addPossibleCommands() {
        let commands = Object.keys(scriptCommandsTypeInfo.definitions);
        for (let c of commands) {
            if (c == 'ScriptCommands')
                continue;
            let option = document.createElement('option');
            option.innerText = c;
            this._possibleCommands.add(option);
        }
    }
    loadScript(script) {
        this._script = script;
        let commandListTreeItems = [];
        for (let c of this._script.commands) {
            commandListTreeItems.push(this.createTreeItem(c));
        }
        ;
        $(this._commandListDiv).fancytree({
            icon: false,
            source: commandListTreeItems,
            copyFunctionsToData: true,
            extensions: ['dnd5'],
            nodata: false,
            activate: (event, data) => {
                let node = data.node;
                this._propertygrid.selectedObject = node.data.item;
            },
            createNode: (event, data) => {
                let span = data.node.span;
                span.oncontextmenu = (e) => {
                    data.node.setActive();
                    if (data.node.data.contextMenu)
                        data.node.data.contextMenu(e, data);
                    e.preventDefault();
                    return false;
                };
            },
            dnd5: {
                dropMarkerParent: this.shadowRoot,
                preventRecursion: true,
                preventVoidMoves: false,
                dropMarkerOffsetX: -24,
                dropMarkerInsertOffsetX: -16,
                dragStart: (node, data) => {
                    data.effectAllowed = "all";
                    data.dropEffect = "move";
                    return true;
                },
                dragEnter: (node, data) => {
                    return ["before", "after"];
                },
                dragOver: (node, data) => {
                    if (data.hitMode == 'over')
                        data.dropEffect = 'none';
                    else
                        data.dropEffect = data.dropEffectSuggested;
                },
                dragDrop: (node, data) => {
                    if (!(node.getLevel() == 1 && (data.hitMode == 'after' || data.hitMode == 'before'))) {
                        return;
                    }
                    let newNode, transfer = data.dataTransfer, sourceNodes = data.otherNodeList, mode = data.dropEffect;
                    if (data.hitMode === "after") {
                        sourceNodes.reverse();
                    }
                    if (data.otherNode) {
                        if (mode === "move") {
                            data.otherNode.moveTo(node, data.hitMode);
                        }
                        else {
                            newNode = data.otherNode.copyTo(node, data.hitMode);
                            if (mode === "link") {
                                newNode.setTitle("Link to " + newNode.title);
                            }
                            else {
                                newNode.setTitle("Copy of " + newNode.title);
                            }
                        }
                    }
                    else if (data.otherNodeData) {
                        //@ts-ignore
                        node.addChild(data.otherNodeData, data.hitMode);
                    }
                    else if (data.files.length) {
                        for (let i = 0; i < data.files.length; i++) {
                            let file = data.files[i];
                            node.addNode({ title: "'" + file.name + "' (" + file.size + " bytes)" }, data.hitMode);
                        }
                    }
                    else {
                        node.addNode({ title: transfer.getData("text") }, data.hitMode);
                    }
                    node.setExpanded();
                },
            },
        });
        this._commandListFancyTree = $(this._commandListDiv).fancytree('getRootNode');
    }
    createTreeItem(currentItem) {
        let cti = {
            title: currentItem.type,
            data: { item: currentItem },
            contextMenu: (e, data) => {
                ContextMenu.show([{ title: 'Remove Item', action: (e) => this.removeItem(data) }], e);
            }
        };
        return cti;
    }
    addItem() {
        const cmdName = this._possibleCommands.value;
        const command = { type: cmdName };
        const ti = this.createTreeItem(command);
        this._commandListFancyTree.addNode(ti);
    }
    async removeItem(data) {
        data.node.remove();
    }
    getScriptCommands() {
        let children = this._commandListFancyTree.children;
        return children.map(x => x.data.item);
    }
    async executeCommand(command) {
        if (command.type === 'save') {
        }
    }
    canExecuteCommand(command) {
        if (command.type === 'save') {
            return true;
        }
        return false;
    }
}
IobrokerWebuiScriptEditor.style = css `
        :host {
            background: white;
        }
        .list{
            display: grid;
            grid-template-columns: 1fr 40px;
            width: 100%;
            box-sizing: border-box;
            margin: 3px;
        }

        .list button{
            padding: 5px 10px;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            margin-right: 5px;
            margin-left: 5px;
        }

        span.fancytree-expander {
            display: none;
        }
        iobroker-webui-property-grid {
            width: 100%;
            height: 100%;
        }
    `;
IobrokerWebuiScriptEditor.template = html `
        <div style="width:100%; height:100%; overflow: hidden;">
            <iobroker-webui-split-view style="height: 100%; width: 100%; position: relative;" orientation="horizontal">
                <div style="width: 40%;  position: relative;">
                    <div style="width:100%; height:100%">
                        <div id="commandList" style="overflow-x: hidden; overflow-y: auto; width:100%; height: calc(100% - 34px);"></div>
                        <div class="list">
                            <select id="possibleCommands" style="width: 100%"></select>  
                            <button @click="[[this.addItem()]]">Add</button>
                        </div>
                    </div> 
                </div>
                <div style="width: 60%; position: relative;">
                    <iobroker-webui-property-grid id="propertygrid"></iobroker-webui-property-grid>
                </div>
            </iobroker-webui-split-view>
        </div>
    `;
IobrokerWebuiScriptEditor.is = 'vscript-editor';
customElements.define("iobroker-webui-script-editor", IobrokerWebuiScriptEditor);
