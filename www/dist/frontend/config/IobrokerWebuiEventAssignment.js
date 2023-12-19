import { BaseCustomWebComponentConstructorAppend, DomHelper, css, html } from "@node-projects/base-custom-webcomponent";
import { ContextMenu, PropertiesHelper } from "@node-projects/web-component-designer";
import { IobrokerWebuiScriptEditor } from "./IobrokerWebuiScriptEditor.js";
import { IobrokerWebuiScreenEditor } from "./IobrokerWebuiScreenEditor.js";
import { findExportFunctionDeclarations } from "../helper/EsprimaHelper.js";
import { IobrokerWebuiMonacoEditor } from "./IobrokerWebuiMonacoEditor.js";
import { IobrokerWebuiBlocklyScriptEditor } from "./blockly/IobrokerWebuiBlocklyScriptEditor.js";
export class IobrokerWebuiEventAssignment extends BaseCustomWebComponentConstructorAppend {
    static style = css `
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
    }`;
    static template = html `
        <template repeat:item="[[this.events]]">
            <div @contextmenu="[[this._ctxMenu(event, item)]]" class="rect" css:background-color="[[this._getEventColor(item)]]"></div>
            <div css:grid-column-end="[[this._getEventType(item) == 'js' ? 'span 1' : 'span 2']]" title="[[item.name]]">[[item.name]]</div>
            <input @input="[[this._inputMthName(event, item)]]" class="mth" value="[[this._getEventMethodname(item)]]" css:display="[[this._getEventType(item) == 'js' ? 'block' : 'none']]" type="text">
            <button @click="[[this._contextMenuAddEvent(event, item)]]">...</button>
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
    _instanceServiceContainer;
    _selectionChangedHandler;
    _selectedItems;
    events;
    set instanceServiceContainer(value) {
        this._instanceServiceContainer = value;
        this._selectionChangedHandler?.dispose();
        this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
            this.selectedItems = e.selectedElements;
        });
        this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
    }
    _getEventColor(eventItem) {
        switch (this._getEventType(eventItem)) {
            case 'js':
                return 'purple';
            case 'blockly':
                return 'yellow';
            case 'script':
                return 'lightgreen';
        }
        return 'white';
    }
    _getEventType(eventItem) {
        if (this.selectedItems && this.selectedItems.length) {
            if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
                const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
                if (val.startsWith('{')) {
                    const parsed = JSON.parse(val);
                    if ('blocks' in parsed)
                        return 'blockly';
                    if ('commands' in parsed)
                        return 'script';
                }
                else
                    return 'js';
            }
        }
        return 'none';
    }
    _getEventMethodname(eventItem) {
        if (this.selectedItems.length)
            return this.selectedItems[0].getAttribute('@' + eventItem.name);
        return '';
    }
    _inputMthName(event, eventItem) {
        let el = event.target;
        this.selectedItems[0].setAttribute('@' + eventItem.name, el.value);
    }
    _ctxMenu(e, eventItem) {
        e.preventDefault();
        ContextMenu.show([{ title: 'remove', action: () => { this.selectedItems[0].removeAttribute('@' + eventItem.name); this._bindingsRefresh(); } }], e);
    }
    async _addEvent(e) {
        if (e.key == 'Enter') {
            let ip = this._getDomElement('addEventInput');
            this._selectedItems[0].setAttribute('@' + PropertiesHelper.camelToDashCase(ip.value.replaceAll(' ', '-')), '');
            ip.value = '';
            this.scrollTop = 0;
            this.refresh();
        }
    }
    async _contextMenuAddEvent(event, eventItem) {
        const evtType = this._getEventType(eventItem);
        if (evtType != 'none') {
            this._editEvent(evtType, event, eventItem);
        }
        else {
            ContextMenu.show([
                {
                    title: 'Simple Script',
                    action: () => {
                        this._editEvent('script', event, eventItem);
                    }
                },
                /* {
                    title: 'Javascript (direct)',
                    action: () => {
                        let nm = prompt('name of function ?');
                        if (nm) {
                            this._selectedItems[0].setAttribute('@' + eventItem.name, nm);
                            this.refresh();
                            this._editEvent('jsdirect', null, eventItem);
                        }
                    }
                }, */
                {
                    title: 'Javascript',
                    action: () => {
                        let nm = prompt('name of function ?');
                        if (nm) {
                            this._selectedItems[0].setAttribute('@' + eventItem.name, nm);
                            this.refresh();
                            this._editEvent('js', null, eventItem);
                        }
                    }
                },
                {
                    title: 'Blockly',
                    action: () => {
                        this._editBlockly(null, eventItem);
                    }
                },
            ], event);
        }
    }
    async _editBlockly(e, eventItem) {
        const edt = new IobrokerWebuiBlocklyScriptEditor();
        edt.title = "Blockly Script for '" + eventItem.name + "'";
        let data = this._selectedItems[0].getAttribute('@' + eventItem.name);
        if (data) {
            edt.load(JSON.parse(data));
        }
        const result = await window.appShell.openConfirmation(edt, 100, 100, 700, 500);
        if (result) {
            const blockObj = edt.save();
            this._selectedItems[0].setAttribute('@' + eventItem.name, JSON.stringify(blockObj));
        }
    }
    async _editEvent(evtType, e, eventItem) {
        if (evtType == 'js') {
            let screenEditor = DomHelper.findParentNodeOfType(this.selectedItems[0].instanceServiceContainer.designerCanvas, IobrokerWebuiScreenEditor);
            let sc = await IobrokerWebuiMonacoEditor.getCompiledJavascriptCode(screenEditor.scriptModel);
            let decl = await findExportFunctionDeclarations(sc);
            if (decl) {
                let jsName = this.selectedItems[0].getAttribute('@' + eventItem.name);
                let funcDecl = decl.find(x => x.declaration.id.name == jsName);
                if (!funcDecl) {
                    let templateScript = `export function ${jsName}(event: ${eventItem.eventObjectName ?? 'Event'}, eventRaisingElement: Element, shadowRoot: ShadowRoot, instance: HTMLElement) {

}
`;
                    if (!sc)
                        sc = 'import { iobrokerHandler } from "/webui/dist/frontend/common/IobrokerHandler.js";\n\n';
                    screenEditor.scriptModel.setValue(sc + templateScript);
                }
                else {
                    //@ts-ignore
                    //window.appShell.javascriptEditor.setSelection(funcDecl.loc.start.line, funcDecl.loc.start.column, funcDecl.loc.end.line, funcDecl.loc.end.column + 1);
                    //as we use typescript, the line does not match the resulting code, need to use ts compiler
                }
            }
            window.appShell.activateDockById('javascriptDock');
        }
        else if (evtType == 'blockly') {
            this._editBlockly(e, eventItem);
        }
        else {
            let scriptString = this.selectedItems[0].getAttribute('@' + eventItem.name);
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
    refresh() {
        if (this._selectedItems != null && this._selectedItems.length) {
            this.events = this._selectedItems[0].serviceContainer.getLastServiceWhere('eventsService', x => x.isHandledElement(this._selectedItems[0])).getPossibleEvents(this._selectedItems[0]);
        }
        else {
            this.events = [];
        }
        this._bindingsRefresh();
    }
    get selectedItems() {
        return this._selectedItems;
    }
    set selectedItems(items) {
        if (this._selectedItems != items) {
            this._selectedItems = items;
            this.refresh();
        }
    }
}
customElements.define("iobroker-webui-event-assignment", IobrokerWebuiEventAssignment);
