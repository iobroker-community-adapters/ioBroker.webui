import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { ContextMenu } from "@node-projects/web-component-designer";
import { IobrokerWebuiScriptEditor } from "./IobrokerWebuiScriptEditor.js";
import { IobrokerWebuiConfirmationWrapper } from "./IobrokerWebuiConfirmationWrapper.js";
export class IobrokerWebuiEventAssignment extends BaseCustomWebComponentConstructorAppend {
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    ready() {
        this._bindingsParse();
    }
    set instanceServiceContainer(value) {
        this._instanceServiceContainer = value;
        this._selectionChangedHandler?.dispose();
        this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
            this.selectedItems = e.selectedElements;
        });
        this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
    }
    _isEventSet(eventItem) {
        if (this.selectedItems && this.selectedItems.length) {
            if (this.selectedItems[0].hasAttribute('@' + eventItem.name))
                return 'lightgreen';
        }
        return 'white';
    }
    _ctxMenu(e, eventItem) {
        e.preventDefault();
        ContextMenu.show([{ title: 'remove', action: () => { this.selectedItems[0].removeAttribute('@' + eventItem.name); this._bindingsRefresh(); } }], e);
    }
    _editEvent(e, eventItem) {
        let scriptString = this.selectedItems[0].getAttribute('@' + eventItem.name);
        if (!scriptString || scriptString.startsWith('{')) {
            let script = { commands: [] };
            if (scriptString)
                script = JSON.parse(scriptString);
            let sc = new IobrokerWebuiScriptEditor();
            sc.loadScript(script);
            sc.title = "Script '" + eventItem.name + "' on " + this.selectedItems[0].name;
            let cw = new IobrokerWebuiConfirmationWrapper();
            cw.title = sc.title;
            cw.appendChild(sc);
            let dlg = window.appShell.openDialog(cw, 100, 100, 500, 300);
            cw.okClicked.on(() => {
                let scriptCommands = sc.getScriptCommands();
                if (scriptCommands && scriptCommands.length) {
                    let json = JSON.stringify({ commands: scriptCommands });
                    this.selectedItems[0].setAttribute('@' + eventItem.name, json);
                    this._bindingsRefresh();
                }
                dlg.close();
            });
            cw.cancelClicked.on(() => dlg.close());
        }
    }
    get selectedItems() {
        return this._selectedItems;
    }
    set selectedItems(items) {
        if (this._selectedItems != items) {
            this._selectedItems = items;
            if (items != null && items.length) {
                this.events = items[0].serviceContainer.getLastServiceWhere('eventsService', x => x.isHandledElement(items[0])).getPossibleEvents(items[0]);
            }
            else {
                this.events = [];
            }
            this._bindingsRefresh();
        }
    }
}
IobrokerWebuiEventAssignment.style = css `
    :host {
        display: grid;
        grid-template-columns: 20px 1fr 30px;
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
    div {
        width: 40px;
        align-self: center;
    }`;
IobrokerWebuiEventAssignment.template = html `
        <template repeat:item="[[this.events]]">
            <div @contextmenu="[[this._ctxMenu(event, item)]]" class="rect" css:background-color="[[this._isEventSet(item)]]"></div>
            <div title="[[item.name]]">[[item.name]]</div>
            <button @click="[[this._editEvent(event, item)]]">...</button>
        </template>`;
customElements.define("iobroker-webui-event-assignment", IobrokerWebuiEventAssignment);
