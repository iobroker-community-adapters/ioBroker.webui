//import Blockly from 'blockly';
import './components/components.js';
const prefix = `import { iobrokerHandler } from "${window.iobrokerWebuiRootUrl}dist/frontend/common/IobrokerHandler.js";
import { extractPart } from "${window.iobrokerWebuiRootUrl}dist/frontend/common/Helper.js";
import { Runtime } from "${window.iobrokerWebuiRootUrl}dist/frontend/common/Runtime.js";

export async function run(eventData, shadowRoot) {
`;
const postfix = `}`;
export async function generateEventCodeFromBlockly(data) {
    //@ts-ignore
    const workspace = new Blockly.Workspace();
    //@ts-ignore
    Blockly.serialization.workspaces.load(data, workspace);
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('eventData');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('shadowRoot');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('extractPart');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('iobrokerHandler');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('Runtime');
    //@ts-ignore
    let code = Blockly.JavaScript.workspaceToCode(workspace);
    const scriptUrl = URL.createObjectURL(new Blob([prefix + code + postfix], { type: 'application/javascript' }));
    const scripObj = await importShim(scriptUrl);
    return scripObj.run;
}
