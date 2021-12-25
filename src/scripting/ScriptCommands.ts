import { iobrokerHandler } from "../IobrokerHandler";
import { ScreenViewer } from "../runtime/ScreenViewer";
import { ScriptMultiplexValue } from "./ScriptValue";

class OpenScreen {
    type: 'openScreen' = 'openScreen';
    screen: string | ScriptMultiplexValue;
    relativeSignalsPath: string;
    openInDialog: boolean;
}

class SetSignal {
    type: 'setSignal' = 'setSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
class IncreaseSignal {
    type: 'increaseSignal' = 'increaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}
class DecreaseSignal {
    type: 'decreaseSignal' = 'decreaseSignal';
    signal: string;
    value: string | number | boolean | ScriptMultiplexValue;
}

class SetBit {
    type: 'setBit' = 'setBit';
    signal: string;
    bitNumber: number;
}
class ClearBit {
    type: 'clearBit' = 'clearBit';
    signal: string;
    bitNumber: number;
}
class ToggleBit {
    type: 'toggleBit' = 'toggleBit';
    signal: string;
    bitNumber: number;
}

class Javascript {
    type: 'javascript' = 'javascript';
    script: string;
}

declare type ScriptCommands = OpenScreen |
    SetSignal | IncreaseSignal | DecreaseSignal |
    SetBit | ClearBit | ToggleBit |
    Javascript;

export class ScriptSystem {
    async execute(scriptCommands: ScriptCommands[], context: any) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'openScreen': {
                    if (!c.openInDialog) {
                        (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = c.relativeSignalsPath;
                        (<ScreenViewer>document.getElementById('viewer')).screenName = this.getValue(c.screen, context);
                    } else {
                        let sv = new ScreenViewer();
                        sv.relativeSignalsPath = c.relativeSignalsPath;
                        sv.screenName = this.getValue(c.screen, context);
                    }
                    break;
                }

                case 'setSignal': {
                    await iobrokerHandler.connection.setState(c.signal, this.getValue(c.value, context));
                    break;
                }
                case 'increaseSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, state.val + this.getValue(c.value, context));
                    break;
                }
                case 'decreaseSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, <any>state.val - this.getValue(c.value, context));
                    break;
                }

                case 'setBit': {
                    await iobrokerHandler.connection.setState(c.signal, true);
                    break;
                }
                case 'clearBit': {
                    await iobrokerHandler.connection.setState(c.signal, false);
                    break;
                }
                case 'toggleBit': {
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

    getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any {
        return value;
    }
}