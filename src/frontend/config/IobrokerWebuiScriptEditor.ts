import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import scriptCommandsTypeInfo from "../generated/ScriptCommands.json" assert { type: 'json' };
import propertiesTypeInfo from "../generated/Properties.json" assert {type: 'json'};
import { Script } from "../scripting/Script.js";
import { ScriptCommands } from "../scripting/ScriptCommands.js";
import { ContextMenu, IUiCommand, IUiCommandHandler } from "@node-projects/web-component-designer";
import { IProperty, IobrokerWebuiPropertyGrid, typeInfoFromJsonSchema } from "./IobrokerWebuiPropertyGrid.js";
import { defaultOptions } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from 'wunderbaum';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' assert { type: 'css' };

export class IobrokerWebuiScriptEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {
    static readonly style = css`
        :host {
            background: white;
        }
        .list{
            display: grid;
            grid-template-columns: 1fr 40px;
            width: calc(100% - 6px);
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

        iobroker-webui-property-grid {
            width: 100%;
            height: 100%;
        }
    `;

    static readonly template = html`
        <div style="width:100%; height:100%; overflow: hidden;">
            <iobroker-webui-split-view style="height: 100%; width: 100%; position: relative;" orientation="horizontal">
                <div style="width: 40%;  position: relative;">
                    <div style="width:calc(100% - 4px); height:calc(100% - 4px)">
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

    static readonly is = 'vscript-editor';

    private _script: Script;

    private _commandListDiv: HTMLDivElement;
    private _commandListFancyTree: Wunderbaum;

    private _possibleCommands: HTMLSelectElement;
    private _propertygrid: IobrokerWebuiPropertyGrid;

    constructor() {
        super();
        this._restoreCachedInititalValues();

        this._commandListDiv = this._getDomElement<HTMLDivElement>('commandList');
        this._possibleCommands = this._getDomElement<HTMLSelectElement>('possibleCommands');
        this._propertygrid = this._getDomElement<IobrokerWebuiPropertyGrid>('propertygrid');

        this.addPossibleCommands();
        this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, IobrokerWebuiScriptEditor.style];
    }

    async ready() {
        this._parseAttributesToProperties();
        this._bindingsParse(null, true);
        this._assignEvents();

        let editComplex = async (data: { value: any, propertyPath: string }) => {
            let pg = new IobrokerWebuiPropertyGrid();
            pg.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
            pg.typeName = 'IScriptMultiplexValue'
            if (typeof data.value === 'object')
                pg.selectedObject = data.value ?? {};
            else
                pg.selectedObject = {};
            let res = await window.appShell.openConfirmation(pg, 100, 100, 300, 300, this);
            if (res) {
                this._propertygrid.setPropertyValue(data.propertyPath, pg.selectedObject);
                this._propertygrid.refresh();
            }
        }
        this._propertygrid.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(scriptCommandsTypeInfo, obj, type);
        this._propertygrid.getSpecialEditorForType = async (property: IProperty, currentValue, propertyPath: string) => {
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
                    editComplex({ value: currentValue, propertyPath })
                }
                d.appendChild(b);
                return d;
            }
            return null;
        }
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
        })
    }

    //Converter from TypscriptJsonSchema to our Property list...

    private async addPossibleCommands() {
        let commands = Object.keys(scriptCommandsTypeInfo.definitions);

        for (let c of commands) {
            if (c == 'ScriptCommands')
                continue;
            let option = document.createElement('option');
            option.innerText = c;
            this._possibleCommands.add(option);
        }
    }

    loadScript(script: Script) {
        this._script = script;

        let commandListTreeItems = [];

        for (let c of this._script.commands) {
            commandListTreeItems.push(this.createTreeItem(c));
        };

        this._commandListFancyTree = new Wunderbaum({
            ...defaultOptions,
            element: this._commandListDiv,
            icon: false,
            source: commandListTreeItems,
            activate: (e) => {
                this._propertygrid.selectedObject = e.node.data.data.item;
            },
            render: (e) => {
                if (e.isNew) {
                    let span = e.nodeElem;
                    span.oncontextmenu = (ev) => {
                        e.node.setActive();
                        if (e.node.data.contextMenu) {
                            e.node.data.contextMenu(ev, e.node.data, e.node);
                        }
                        ev.preventDefault();
                        return false;
                    }
                }
            },
            dnd: {
                guessDropEffect: true,
                preventRecursion: true,
                preventVoidMoves: false,
                serializeClipboardData: false,
                dragStart: (e) => {
                    e.event.dataTransfer.effectAllowed = "move";
                    e.event.dataTransfer.dropEffect = "move";
                    return true;
                },
                dragEnter: (e) => {
                    e.event.dataTransfer.dropEffect = 'move';
                    return true;
                },
                dragOver: (e) => {
                    e.event.dataTransfer.dropEffect = 'move';
                },
                drop: async (e) => {
                    e.sourceNode.moveTo(e.node, e.region == 'before' ? 'before' : 'after');
                }
            }
        });
    }

    private createTreeItem(currentItem: ScriptCommands) {
        let cti = {
            title: currentItem.type,
            data: { item: currentItem },
            contextMenu: (e, data, node) => {
                ContextMenu.show([{ title: 'Remove Item', action: (e) => node.remove() }], e);
            }
        };
        return cti;
    }

    addItem() {
        const cmdName = this._possibleCommands.value;
        const command = { type: cmdName }
        const ti = this.createTreeItem(<any>command);
        this._commandListFancyTree.addChildren(ti);
    }

    getScriptCommands() {
        let children = this._commandListFancyTree.root.children;
        return children.map(x => x.data.data.item);
    }

    async executeCommand(command: IUiCommand | { type: string }) {
        if (command.type === 'save') {

        }
    }

    canExecuteCommand(command: IUiCommand | { type: string }) {
        if (command.type === 'save') {
            return true;
        }
        return false;
    }
}
customElements.define("iobroker-webui-script-editor", IobrokerWebuiScriptEditor);