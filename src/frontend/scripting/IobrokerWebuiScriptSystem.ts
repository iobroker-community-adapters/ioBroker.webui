import type { ScriptCommands, contextType } from "@node-projects/web-component-designer-visualization-addons";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { IoBrokerWebuiDialog } from "../helper/DialogHelper.js";
import { ScriptSystem } from "@node-projects/web-component-designer-visualization-addons/dist/scripting/ScriptSystem.js";

export class IobrokerWebuiScriptSystem extends ScriptSystem {
    override async runScriptCommand<T extends ScriptCommands>(command: T, context) {
        switch (command.type) {
            case 'CloseDialog': {
                IoBrokerWebuiDialog.closeDialog({ element: <HTMLElement>context.element });
                break;
            }
            case 'OpenScreen': {
                const screen = await this.getValue(command.screen, context);
                if (command.noHistory) {
                    (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = await this.getValue(command.relativeSignalsPath, context);
                    (<ScreenViewer>document.getElementById('viewer')).screenName = screen;
                } else {
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
                    height = await (await iobrokerHandler.getWebuiObject('screen', screen)).settings.height
                IoBrokerWebuiDialog.openDialog({ title, content: sv, moveable, closeable, width, height, top, left });
                break;
            }

            default: {
                await super.runScriptCommand(command, context);
            }
        }
    }

    override getTarget(context: contextType, targetSelectorTarget: 'element' | 'container', parentLevel: number) {
        if (targetSelectorTarget == "container") {
            let el = context.element
            for (let i = 0; i <= (parentLevel ?? 0); i++) {
                let rootDiv = (<ShadowRoot>el.getRootNode()).host;
                if (rootDiv instanceof BaseCustomControl)
                    el = rootDiv;
                else
                    el = (<ShadowRoot>rootDiv.getRootNode()).host;
            }
            return el;
        }
        return super.getTarget(context, targetSelectorTarget, parentLevel);
    }

    override getTargetFromTargetSelector(context: contextType, targetSelectorTarget: 'element' | 'container', parentLevel: number, targetSelector: string): Iterable<Element> {
        const target = this.getTarget(context, targetSelectorTarget, parentLevel);
        let elements: Iterable<Element> = [target];
        if (targetSelector) {
            if (targetSelectorTarget === 'container') {
                if (target instanceof ScreenViewer)
                    elements = target._getDomElements(targetSelector);
                else
                    elements = target.shadowRoot.querySelectorAll(targetSelector);
            }
            else
                elements = target.querySelectorAll(targetSelector);
        }
        return elements;
    }
}