import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { ScriptCommands } from "./ScriptCommands.js";
import { ScriptMultiplexValue } from "./ScriptValue.js";

export class ScriptSystem {
    static async execute(scriptCommands: ScriptCommands[], context: any) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'OpenScreen': {
                    if (!c.openInDialog) {
                        (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = c.relativeSignalsPath;
                        (<ScreenViewer>document.getElementById('viewer')).screenName = ScriptSystem.getValue(c.screen, context);
                    } else {
                        let sv = new ScreenViewer();
                        sv.relativeSignalsPath = c.relativeSignalsPath;
                        sv.screenName = ScriptSystem.getValue(c.screen, context);
                    }
                    break;
                }

                case 'ToggleSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, !state.val);
                    break;
                }
                case 'SetSignalValue': {
                    await iobrokerHandler.connection.setState(c.signal, ScriptSystem.getValue(c.value, context));
                    break;
                }
                case 'IncrementSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, state.val + ScriptSystem.getValue(c.value, context));
                    break;
                }
                case 'DecrementSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, <any>state.val - ScriptSystem.getValue(c.value, context));
                    break;
                }

                case 'SetBitInSignal': {
                    //todo: bit
                    await iobrokerHandler.connection.setState(c.signal, true);
                    break;
                }
                case 'ClearBitInSignal': {
                    //todo: bit
                    await iobrokerHandler.connection.setState(c.signal, false);
                    break;
                }
                case 'ToggleBitInSignal': {
                    //todo: bit
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, !state.val);
                    break;
                }

                case 'Javascript': {
                    var context = context; // make context accessible from script
                    eval(c.script);
                    break;
                }
            }
        }
    }

    static getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any {
        return value;
    }
}