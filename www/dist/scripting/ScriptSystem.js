import { iobrokerHandler } from "../IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
export class ScriptSystem {
    async execute(scriptCommands, context) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'openScreen': {
                    if (!c.openInDialog) {
                        document.getElementById('viewer').relativeSignalsPath = c.relativeSignalsPath;
                        document.getElementById('viewer').screenName = this.getValue(c.screen, context);
                    }
                    else {
                        let sv = new ScreenViewer();
                        sv.relativeSignalsPath = c.relativeSignalsPath;
                        sv.screenName = this.getValue(c.screen, context);
                    }
                    break;
                }
                case 'setSignalValue': {
                    await iobrokerHandler.connection.setState(c.signal, this.getValue(c.value, context));
                    break;
                }
                case 'incrementSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, state.val + this.getValue(c.value, context));
                    break;
                }
                case 'decrementSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, state.val - this.getValue(c.value, context));
                    break;
                }
                case 'setBitInSignal': {
                    //todo: bit
                    await iobrokerHandler.connection.setState(c.signal, true);
                    break;
                }
                case 'clearBitInSignal': {
                    //todo: bit
                    await iobrokerHandler.connection.setState(c.signal, false);
                    break;
                }
                case 'toggleBitInSignal': {
                    //todo: bit
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, !state.val);
                    break;
                }
                case 'javascript': {
                    var context = context; // make context accessible from script
                    eval(c.script);
                    break;
                }
            }
        }
    }
    getValue(value, context) {
        return value;
    }
}
