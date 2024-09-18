import { DomHelper } from "@node-projects/base-custom-webcomponent";
import { EventAssignment } from "@node-projects/web-component-designer-visualization-addons";
import { IobrokerWebuiScreenEditor } from "./IobrokerWebuiScreenEditor.js";
import { findExportFunctionDeclarations } from "../helper/EsprimaHelper.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import scriptCommandsTypeInfo from "../generated/ScriptCommands.json" with { type: 'json' };
import propertiesTypeInfo from "../generated/Properties.json" with { type: 'json' };
import webuiBlocklyToolbox from "../scripting/blockly/webuiBlocklyToolbox.js";
export class IobrokerWebuiEventAssignment extends EventAssignment {
    constructor() {
        super();
        this.initialize(iobrokerHandler, window.appShell, scriptCommandsTypeInfo, propertiesTypeInfo, webuiBlocklyToolbox);
    }
    async _editJavascript(e, eventItem) {
        let screenEditor = DomHelper.findParentNodeOfType(this.selectedItems[0].instanceServiceContainer.designerCanvas, IobrokerWebuiScreenEditor);
        let sc = screenEditor.scriptModel.getValue();
        let decl = await findExportFunctionDeclarations(sc);
        if (decl) {
            let jsName = this.selectedItems[0].getAttribute('@' + eventItem.name);
            if (jsName[0] === '{') {
                const parsed = JSON.parse(jsName);
                jsName = parsed.name;
            }
            let funcDecl = decl.find(x => x.declaration.id.name == jsName);
            if (!funcDecl) {
                let templateScript = `/**
* ${jsName} - '${eventItem.name}' event of ${this.selectedItems[0].id ? '#' + this.selectedItems[0].id + ' (<' + this.selectedItems[0].name + '>)' : '<' + this.selectedItems[0].name + '>'}
* @param {${eventItem.eventObjectName ?? 'Event'}} event
* @param {Element} eventRaisingElement
* @param {ShadowRoot} shadowRoot
* @param {BaseScreenViewerAndControl} instance
* @param {Object.<string, *>} parameters
*/
export function ${jsName}(event, eventRaisingElement, shadowRoot, instance, parameters) {
    
}
`;
                if (!sc)
                    screenEditor.scriptModel.setValue(templateScript);
                else {
                    sc += "\n" + templateScript;
                    screenEditor.scriptModel.setValue(sc);
                }
            }
            else {
                //@ts-ignore
                window.appShell.javascriptEditor.setSelection(funcDecl.loc.start.line, funcDecl.loc.start.column, funcDecl.loc.end.line, funcDecl.loc.end.column + 1);
            }
        }
        window.appShell.activateDockById('javascriptDock');
    }
}
customElements.define("iobroker-webui-event-assignment", IobrokerWebuiEventAssignment);
