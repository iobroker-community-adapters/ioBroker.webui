import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import Long from 'long';
export class ScriptSystem {
    static async execute(scriptCommands, context) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'OpenScreen': {
                    if (!c.openInDialog) {
                        document.getElementById('viewer').relativeSignalsPath = c.relativeSignalsPath;
                        document.getElementById('viewer').screenName = ScriptSystem.getValue(c.screen, context);
                    }
                    else {
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
                    await iobrokerHandler.connection.setState(c.signal, state.val - ScriptSystem.getValue(c.value, context));
                    break;
                }
                case 'SetBitInSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    const newVal = Long.fromNumber(state.val).or(mask).toNumber();
                    await iobrokerHandler.connection.setState(c.signal, newVal);
                    break;
                }
                case 'ClearBitInSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    mask.negate();
                    const newVal = Long.fromNumber(state.val).and(mask).toNumber();
                    await iobrokerHandler.connection.setState(c.signal, newVal);
                    break;
                }
                case 'ToggleBitInSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    const newVal = Long.fromNumber(state.val).xor(mask).toNumber();
                    await iobrokerHandler.connection.setState(c.signal, newVal);
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
    static getValue(value, context) {
        return value;
    }
}
