import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { IoBrokerWebuiDialog } from "../helper/DialogHelper.js";
import { ScriptSystem } from "@node-projects/web-component-designer-visualization-addons/dist/scripting/ScriptSystem.js";
export class IobrokerWebuiScriptSystem extends ScriptSystem {
    async runScriptCommand(command, context) {
        switch (command.type) {
            case 'CloseDialog': {
                IoBrokerWebuiDialog.closeDialog({ element: context.element });
                break;
            }
            case 'OpenScreen': {
                const screen = await this.getValue(command.screen, context);
                if (command.noHistory) {
                    document.getElementById('viewer').relativeSignalsPath = await this.getValue(command.relativeSignalsPath, context);
                    document.getElementById('viewer').screenName = screen;
                }
                else {
                    let hash = 'screenName=' + screen;
                    window.location.hash = hash;
                }
                break;
            }
            case 'OpenDialog': {
                const screen = await this.getValue(command.screen, context);
                const title = await this.getValue(command.title, context);
                const moveable = await this.getValue(command.moveable, context);
                const closeable = await this.getValue(command.closeable, context);
                let width = await this.getValue(command.width, context);
                let height = await this.getValue(command.height, context);
                const left = await this.getValue(command.left, context);
                const top = await this.getValue(command.top, context);
                let sv = new ScreenViewer();
                sv.relativeSignalsPath = command.relativeSignalsPath;
                sv.screenName = screen;
                if (!width)
                    width = await (await iobrokerHandler.getWebuiObject('screen', screen)).settings.width;
                if (!height)
                    height = await (await iobrokerHandler.getWebuiObject('screen', screen)).settings.height;
                IoBrokerWebuiDialog.openDialog({ title, content: sv, moveable, closeable, width, height, top, left });
                break;
            }
            default: {
                super.runScriptCommand(command, context);
            }
        }
    }
    getTargetFromTargetSelector(context, targetSelectorTarget, targetSelector) {
        if (targetSelectorTarget === 'currentScreen') {
            if (targetSelector) {
                let sr = context.element.getRootNode();
                return sr.querySelectorAll(targetSelector);
            }
            else {
                let rootDiv = context.element.getRootNode().host;
                let sr = rootDiv.getRootNode();
                return [sr.host];
            }
        }
        else if (targetSelectorTarget === 'parentScreen') {
            if (targetSelector) {
                //@ts-ignore
                let sr = context.element.getRootNode().host.getRootNode().host.getRootNode();
                return sr.querySelectorAll(targetSelector);
            }
            else {
                //@ts-ignore
                let sr = context.element.getRootNode().host.getRootNode().host.getRootNode().host.getRootNode().host;
                return [sr];
            }
        }
        else
            return super.getTargetFromTargetSelector(context, targetSelectorTarget, targetSelector);
    }
}
