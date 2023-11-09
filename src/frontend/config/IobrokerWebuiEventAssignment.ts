import { BaseCustomWebComponentConstructorAppend, Disposable, DomHelper, css, html } from "@node-projects/base-custom-webcomponent"
import { ContextMenu, IDesignItem, IEvent, InstanceServiceContainer, PropertiesHelper } from "@node-projects/web-component-designer";
import { IobrokerWebuiScriptEditor } from "./IobrokerWebuiScriptEditor.js";
import { IobrokerWebuiScreenEditor } from "./IobrokerWebuiScreenEditor.js";
import { findExportFunctionDeclarations } from "../helper/EsprimaHelper.js";
import type { FunctionDeclaration } from "esprima-next";
import { IobrokerWebuiMonacoEditor } from "./IobrokerWebuiMonacoEditor.js";

export class IobrokerWebuiEventAssignment extends BaseCustomWebComponentConstructorAppend {

    static override style = css`
    :host {
        display: grid;
        grid-template-columns: 20px 1fr auto 30px;
        overflow-y: auto;
        align-content: start;
        height: 100%;
    }
    .rect {
        width: 7px;
        height: 7px;
        border: 1px solid black;
        justify-self: center;
    }
    input.mth {
        width: 100%;
        box-sizing: border-box;
    }
    div {
        width: 40px;
        align-self: center;
        white-space: nowrap;
    }`

    static override template = html`
        <template repeat:item="[[this.events]]">
            <div @contextmenu="[[this._ctxMenu(event, item)]]" class="rect" css:background-color="[[this._getEventColor(item)]]"></div>
            <div css:grid-column-end="[[this._getEventType(item) == 'js' ? 'span 1' : 'span 2']]" title="[[item.name]]">[[item.name]]</div>
            <input @input="[[this._inputMthName(event, item)]]" class="mth" value="[[this._getEventMethodname(item)]]" css:display="[[this._getEventType(item) == 'js' ? 'block' : 'none']]" type="text">
            <button @contextmenu="[[this._contextMenuAddEvent(event, item)]]" @click="[[this._editEvent(event, item)]]">...</button>
        </template>
        <span style="grid-column: 1 / span 3; margin-top: 8px; margin-left: 3px;">add event:</span>
        <input id="addEventInput" style="grid-column: 1 / span 3; margin: 5px;" @keypress=[[this._addEvent(event)]] type="text">`;

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    ready() {
        this._bindingsParse();
    }

    private _instanceServiceContainer: InstanceServiceContainer;
    private _selectionChangedHandler: Disposable;
    private _selectedItems: IDesignItem[];

    public events: IEvent[];

    public set instanceServiceContainer(value: InstanceServiceContainer) {
        this._instanceServiceContainer = value;
        this._selectionChangedHandler?.dispose()
        this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
            this.selectedItems = e.selectedElements;
        });
        this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
    }

    public _getEventColor(eventItem: IEvent) {
        switch (this._getEventType(eventItem)) {
            case 'js':
                return 'purple';
            case 'script':
                return 'lightgreen';
        }
        return 'white';
    }

    public _getEventType(eventItem: IEvent): 'js' | 'script' | 'none' {
        if (this.selectedItems && this.selectedItems.length) {
            if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
                if (this.selectedItems[0].getAttribute('@' + eventItem.name).startsWith('{'))
                    return 'script';
                else
                    return 'js';
            }
        }
        return 'none';
    }

    public _getEventMethodname(eventItem: IEvent): string {
        if (this.selectedItems.length)
            return this.selectedItems[0].getAttribute('@' + eventItem.name);
        return '';
    }

    public _inputMthName(event: InputEvent, eventItem: IEvent) {
        let el = event.target as HTMLInputElement
        this.selectedItems[0].setAttribute('@' + eventItem.name, el.value);
    }

    public _ctxMenu(e: MouseEvent, eventItem: IEvent) {
        e.preventDefault();
        ContextMenu.show([{ title: 'remove', action: () => { this.selectedItems[0].removeAttribute('@' + eventItem.name); this._bindingsRefresh(); } }], e)
    }

    public async _addEvent(e: KeyboardEvent) {
        if (e.key == 'Enter') {
            let ip = this._getDomElement<HTMLInputElement>('addEventInput');
            this._selectedItems[0].setAttribute('@' + PropertiesHelper.camelToDashCase(ip.value.replaceAll(' ', '-')), '');
            ip.value = '';
            this.scrollTop = 0;
            this.refresh();
        }
    }

    public async _contextMenuAddEvent(event, eventItem: IEvent) {
        ContextMenu.show([{
            title: 'Add JS Handler',
            action: () => {
                let nm = prompt('name of function ?');
                if (nm) {
                    this._selectedItems[0].setAttribute('@' + eventItem.name, nm);
                    this.refresh();
                    this._editEvent(null, eventItem);
                }
            }
        }], event);
    }

    public async _editEvent(e: MouseEvent, eventItem: IEvent) {
        if (this._getEventType(eventItem) == 'js') {
            let screenEditor = DomHelper.findParentNodeOfType(this.selectedItems[0].instanceServiceContainer.designerCanvas, IobrokerWebuiScreenEditor);
            let sc = await IobrokerWebuiMonacoEditor.getCompiledJavascriptCode(screenEditor.scriptModel);

            let decl = await findExportFunctionDeclarations(sc);
            if (decl) {
                let jsName = this.selectedItems[0].getAttribute('@' + eventItem.name);
                let funcDecl = decl.find(x => (<FunctionDeclaration>x.declaration).id.name == jsName)
                if (!funcDecl) {
                    let templateScript = `export function ${jsName}(event: ${eventItem.eventObjectName ?? 'Event'}, eventRaisingElement: Element, shadowRoot: ShadowRoot, instance: HTMLElement) {

}
`;
                    if (!sc)
                        sc = 'import { iobrokerHandler } from "/webui/dist/frontend/common/IobrokerHandler.js";\n\n';
                    screenEditor.scriptModel.setValue(sc + templateScript);
                } else {
                    //@ts-ignore
                    //window.appShell.javascriptEditor.setSelection(funcDecl.loc.start.line, funcDecl.loc.start.column, funcDecl.loc.end.line, funcDecl.loc.end.column + 1);
                    //as we use typescript, the line does not match the resulting code, need to use ts compiler
                }
            }
            window.appShell.activateDockById('javascriptDock');
        } else {
            let scriptString = <string>this.selectedItems[0].getAttribute('@' + eventItem.name);
            if (!scriptString || scriptString.startsWith('{')) {
                let script = { commands: [] };
                if (scriptString)
                    script = JSON.parse(scriptString);
                let sc = new IobrokerWebuiScriptEditor();
                sc.loadScript(script);
                sc.title = "Script '" + eventItem.name + "' on " + this.selectedItems[0].name;

                let res = await window.appShell.openConfirmation(sc, 100, 100, 600, 500);
                if (res) {
                    let scriptCommands = sc.getScriptCommands();
                    if (scriptCommands && scriptCommands.length) {
                        let json = JSON.stringify({ commands: scriptCommands });
                        this.selectedItems[0].setAttribute('@' + eventItem.name, json);
                        this._bindingsRefresh();
                    }
                }
            }
        }
    }

    public refresh() {
        if (this._selectedItems != null && this._selectedItems.length) {
            this.events = this._selectedItems[0].serviceContainer.getLastServiceWhere('eventsService', x => x.isHandledElement(this._selectedItems[0])).getPossibleEvents(this._selectedItems[0]);
        } else {
            this.events = [];
        }
        this._bindingsRefresh();
    }

    get selectedItems() {
        return this._selectedItems;
    }
    set selectedItems(items: IDesignItem[]) {
        if (this._selectedItems != items) {
            this._selectedItems = items;
            this.refresh();
        }
    }
}

customElements.define("iobroker-webui-event-assignment", IobrokerWebuiEventAssignment);